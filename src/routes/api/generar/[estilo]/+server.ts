import { error, json } from '@sveltejs/kit';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { RequestHandler } from './$types';
import { HF_BASE } from '$lib/server/hf-sxm';
import { STYLES } from '$lib/styleCatalog';
import { db } from '$lib/server/db';
import { generaciones } from '$lib/server/db/schema';

const GENERADO_DIR = path.resolve('data/generado');

// El space a veces manda un Content-Type que no coincide con los bytes reales
// (ej. dice "image/jpg" pero el cuerpo es WebP) — mejor detectar por firma binaria.
function sniffImage(buffer: Buffer): { ext: string; contentType: string } {
	if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
		return { ext: 'png', contentType: 'image/png' };
	}
	if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
		return { ext: 'jpg', contentType: 'image/jpeg' };
	}
	if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
		return { ext: 'webp', contentType: 'image/webp' };
	}
	return { ext: 'bin', contentType: 'application/octet-stream' };
}

async function guardar(buffer: Buffer, ext: string) {
	const archivo = `${crypto.randomUUID()}.${ext}`;
	await writeFile(path.join(GENERADO_DIR, archivo), buffer);
	return archivo;
}

export const POST: RequestHandler = async ({ params, request }) => {
	const estilo = params.estilo ?? '';
	const def = STYLES[estilo];
	if (!def) throw error(404, `Estilo desconocido: ${estilo}`);

	const incoming = await request.formData();
	const image = incoming.get('image');
	if (!(image instanceof File)) throw error(400, 'Falta el archivo "image"');

	const forward = new FormData();
	forward.append('image', image, image.name);

	const parametros: Record<string, string> = {};
	for (const p of def.params) {
		const value = incoming.get(p.name);
		if (typeof value === 'string' && value.length > 0) {
			forward.append(p.name, value);
			parametros[p.name] = value;
		}
	}

	const hfRes = await fetch(`${HF_BASE}/${estilo}/`, { method: 'POST', body: forward });
	const declaredType = hfRes.headers.get('content-type') ?? '';
	const buffer = Buffer.from(await hfRes.arrayBuffer());

	// El space responde 200 OK con content-type JSON incluso para sus propios errores
	// lógicos (p. ej. "Face not detected"), así que el content-type manda, no el status.
	if (!hfRes.ok || declaredType.includes('application/json')) {
		const detail = buffer.toString('utf-8');
		let mensaje = detail;
		try {
			mensaje = JSON.parse(detail).error ?? detail;
		} catch {
			// no era JSON parseable, se usa el texto crudo
		}
		throw error(422, mensaje || `El servicio de generación falló (${hfRes.status})`);
	}

	const { ext } = sniffImage(buffer);

	// El space no siempre regresa 1:1 (hemos visto 1024x1024 y 1024x768 para el mismo
	// estilo) — forzamos el cuadrado nosotros con un recorte centrado.
	const metadata = await sharp(buffer).metadata();
	const lado = Math.min(metadata.width ?? 0, metadata.height ?? 0);
	const cuadradoBuffer = await sharp(buffer)
		.extract({
			left: Math.floor(((metadata.width ?? lado) - lado) / 2),
			top: Math.floor(((metadata.height ?? lado) - lado) / 2),
			width: lado,
			height: lado
		})
		.toBuffer();

	await mkdir(GENERADO_DIR, { recursive: true });
	const archivoOriginal = await guardar(buffer, ext);
	const archivoCuadrado = await guardar(cuadradoBuffer, ext);

	await db.insert(generaciones).values({
		juego: 'buzito',
		estilo,
		parametros: JSON.stringify(parametros),
		archivoOriginal,
		archivoCuadrado
	});

	return json({
		original: `/generado/${archivoOriginal}`,
		cuadrado: `/generado/${archivoCuadrado}`
	});
};
