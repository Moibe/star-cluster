import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { generaciones, subidas } from '$lib/server/db/schema';

export const load: PageServerLoad = () => {
	const filas = db.select().from(generaciones).orderBy(desc(generaciones.creado)).all();
	const todasSubidas = db.select().from(subidas).all();
	const subidaById = new Map(todasSubidas.map((s) => [s.id, s]));

	type Item = {
		id: number;
		estilo: string;
		parametros: Record<string, string>;
		original: string;
		cuadrado: string;
		creado: string;
	};
	type Grupo = { subidaId: number | null; foto: string | null; creado: string | null; items: Item[] };

	const gruposMap = new Map<number, Grupo>();
	const sinOrigen: Item[] = [];

	for (const f of filas) {
		const item: Item = {
			id: f.id,
			estilo: f.estilo,
			parametros: JSON.parse(f.parametros || '{}'),
			original: `/generado/${f.archivoOriginal}`,
			cuadrado: `/generado/${f.archivoCuadrado}`,
			creado: f.creado.toISOString()
		};

		const subida = f.subidaId !== null ? subidaById.get(f.subidaId) : undefined;
		if (f.subidaId !== null && subida) {
			let grupo = gruposMap.get(f.subidaId);
			if (!grupo) {
				grupo = {
					subidaId: f.subidaId,
					foto: `/generado/${subida.archivo}`,
					creado: subida.creado.toISOString(),
					items: []
				};
				gruposMap.set(f.subidaId, grupo);
			}
			grupo.items.push(item);
		} else {
			sinOrigen.push(item);
		}
	}

	const grupos = Array.from(gruposMap.values()).sort((a, b) => (b.creado as string).localeCompare(a.creado as string));
	if (sinOrigen.length) {
		grupos.push({ subidaId: null, foto: null, creado: null, items: sinOrigen });
	}

	return { grupos, total: filas.length };
};
