import { error, json } from '@sveltejs/kit';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { generaciones } from '$lib/server/db/schema';

const GENERADO_DIR = path.resolve('data/generado');

export const POST: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(400, 'id inválido');

	const body = await request.json();
	const { left, top, size } = body ?? {};
	if (![left, top, size].every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)) {
		throw error(400, 'Coordenadas de recorte inválidas');
	}

	const fila = db.select().from(generaciones).where(eq(generaciones.id, id)).get();
	if (!fila) throw error(404, 'Generación no encontrada');

	const originalPath = path.join(GENERADO_DIR, fila.archivoOriginal);
	const metadata = await sharp(originalPath).metadata();
	const w = metadata.width ?? 0;
	const h = metadata.height ?? 0;

	// Clamp defensivo: el cliente calcula estos valores a partir de lo que ve en
	// pantalla, así que un redondeo o un resize a mitad de arrastre podría mandar
	// coordenadas ligeramente fuera de rango.
	const ladoFinal = Math.min(Math.round(size), w, h);
	const leftFinal = Math.min(Math.max(Math.round(left), 0), w - ladoFinal);
	const topFinal = Math.min(Math.max(Math.round(top), 0), h - ladoFinal);

	const recorte = await sharp(originalPath)
		.extract({ left: leftFinal, top: topFinal, width: ladoFinal, height: ladoFinal })
		.toBuffer();

	await writeFile(path.join(GENERADO_DIR, fila.archivoCuadrado), recorte);

	return json({ cuadrado: `/generado/${fila.archivoCuadrado}` });
};
