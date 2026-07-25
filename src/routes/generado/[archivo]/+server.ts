import { error } from '@sveltejs/kit';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from './$types';

const GENERADO_DIR = path.resolve('data/generado');
const CONTENT_TYPE_BY_EXT: Record<string, string> = {
	png: 'image/png',
	jpg: 'image/jpeg',
	webp: 'image/webp'
};

// Solo nombres uuid.ext generados por nosotros mismos — evita path traversal.
const NOMBRE_VALIDO = /^[a-f0-9-]+\.(png|jpg|webp)$/;

export const GET: RequestHandler = async ({ params }) => {
	const archivo = params.archivo ?? '';
	if (!NOMBRE_VALIDO.test(archivo)) throw error(400, 'Nombre de archivo inválido');

	const ext = archivo.split('.').pop() ?? '';
	try {
		const buffer = await readFile(path.join(GENERADO_DIR, archivo));
		return new Response(buffer, {
			headers: { 'content-type': CONTENT_TYPE_BY_EXT[ext] ?? 'application/octet-stream' }
		});
	} catch {
		throw error(404, 'No encontrado');
	}
};
