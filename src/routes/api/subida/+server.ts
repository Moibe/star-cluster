import { error, json } from '@sveltejs/kit';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { subidas } from '$lib/server/db/schema';

const GENERADO_DIR = path.resolve('data/generado');

const EXT_BY_MIME: Record<string, string> = {
	'image/png': 'png',
	'image/webp': 'webp',
	'image/jpeg': 'jpg',
	'image/jpg': 'jpg'
};

function extDeArchivo(file: File): string {
	if (EXT_BY_MIME[file.type]) return EXT_BY_MIME[file.type];
	const fromName = file.name.split('.').pop();
	return fromName && fromName.length <= 5 ? fromName.toLowerCase() : 'jpg';
}

// Registra una "subida" (la foto original) ANTES de generar nada. El cliente
// llama esto una sola vez por foto y reusa el id para todos los estilos que
// generes con ella — así la galería puede agruparlas por foto de origen.
export const POST: RequestHandler = async ({ request }) => {
	const incoming = await request.formData();
	const image = incoming.get('image');
	if (!(image instanceof File)) throw error(400, 'Falta el archivo "image"');

	await mkdir(GENERADO_DIR, { recursive: true });
	const buffer = Buffer.from(await image.arrayBuffer());
	const archivo = `${crypto.randomUUID()}.${extDeArchivo(image)}`;
	await writeFile(path.join(GENERADO_DIR, archivo), buffer);

	const [fila] = await db.insert(subidas).values({ archivo }).returning({ id: subidas.id });

	return json({ id: fila.id, foto: `/generado/${archivo}` });
};
