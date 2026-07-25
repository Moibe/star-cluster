import type { ItemResultado } from './ResultadoGrid.svelte';

export type Trabajo = {
	key: string;
	label: string;
	estilo: string;
	campos: Record<string, string>;
};

function crearLote() {
	let lote = $state({
		resultados: [] as ItemResultado[],
		procesando: false
	});
	return lote;
}

// Un objeto reactivo por tester, creado UNA vez al cargar el módulo — así
// sobrevive la navegación entre páginas (SvelteKit no recarga el documento al
// cambiar de ruta). Si el usuario se va de /batch o /params mientras el lote
// sigue corriendo y regresa, ve justo donde se quedó en vez de una grilla vacía.
export const loteBatch = crearLote();
export const loteParams = crearLote();

export async function ejecutarLote(lote: ReturnType<typeof crearLote>, file: File, trabajos: Trabajo[]) {
	lote.procesando = true;
	lote.resultados = trabajos.map((t) => ({ key: t.key, label: t.label, estado: 'pendiente' }));

	let subidaId: number;
	try {
		const form = new FormData();
		form.append('image', file);
		const res = await fetch('/api/subida', { method: 'POST', body: form });
		const body = await res.json().catch(() => null);
		if (!res.ok) throw new Error(body?.message ?? `Error ${res.status}`);
		subidaId = body.id;
	} catch (err) {
		const mensaje =
			err instanceof TypeError
				? 'No se pudo conectar con el servidor.'
				: err instanceof Error
					? err.message
					: 'Algo falló.';
		lote.resultados = trabajos.map((t) => ({ key: t.key, label: t.label, estado: 'error', mensaje }));
		lote.procesando = false;
		return;
	}

	// Secuencial a propósito: no saturamos el space con llamadas concurrentes, y
	// así van apareciendo una por una conforme se generan.
	for (const trabajo of trabajos) {
		const idx = lote.resultados.findIndex((r) => r.key === trabajo.key);
		lote.resultados[idx] = { key: trabajo.key, label: trabajo.label, estado: 'cargando' };

		const form = new FormData();
		form.append('image', file);
		form.append('subidaId', String(subidaId));
		for (const [nombre, valor] of Object.entries(trabajo.campos)) form.append(nombre, valor);

		try {
			const res = await fetch(`/api/generar/${trabajo.estilo}`, { method: 'POST', body: form });
			const body = await res.json().catch(() => null);
			if (!res.ok) throw new Error(body?.message ?? `Error ${res.status}`);
			lote.resultados[idx] = {
				key: trabajo.key,
				label: trabajo.label,
				estado: 'ok',
				cuadrado: body.cuadrado,
				original: body.original
			};
		} catch (err) {
			const mensaje =
				err instanceof TypeError
					? 'No se pudo conectar con el servidor.'
					: err instanceof Error
						? err.message
						: 'Algo falló.';
			lote.resultados[idx] = { key: trabajo.key, label: trabajo.label, estado: 'error', mensaje };
		}
	}
	lote.procesando = false;
}
