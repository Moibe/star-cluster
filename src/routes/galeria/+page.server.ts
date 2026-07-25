import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { generaciones } from '$lib/server/db/schema';

export const load: PageServerLoad = () => {
	const filas = db.select().from(generaciones).orderBy(desc(generaciones.creado)).all();

	return {
		generaciones: filas.map((f) => ({
			id: f.id,
			juego: f.juego,
			estilo: f.estilo,
			parametros: JSON.parse(f.parametros || '{}') as Record<string, string>,
			original: `/generado/${f.archivoOriginal}`,
			cuadrado: `/generado/${f.archivoCuadrado}`,
			creado: f.creado.toISOString()
		}))
	};
};
