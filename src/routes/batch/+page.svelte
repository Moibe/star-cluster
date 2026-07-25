<script lang="ts">
	import Dropzone from '$lib/Dropzone.svelte';
	import ResultadoGrid, { type ItemResultado } from '$lib/ResultadoGrid.svelte';
	import { STYLES, STYLE_KEYS } from '$lib/styleCatalog';

	let file: File | null = $state(null);
	let procesando = $state(false);
	let resultados: ItemResultado[] = $state([]);
	let subidaId: number | null = $state(null);

	// Foto nueva = subida (grupo) nueva en la galería; todos los estilos de este
	// mismo batch comparten la misma subida.
	$effect(() => {
		file;
		subidaId = null;
	});

	async function generarUno(estilo: string, idSubida: number) {
		const idx = resultados.findIndex((r) => r.key === estilo);
		resultados[idx] = { key: estilo, label: STYLES[estilo].label, estado: 'cargando' };

		const form = new FormData();
		form.append('image', file as File);
		form.append('subidaId', String(idSubida));

		try {
			const res = await fetch(`/api/generar/${estilo}`, { method: 'POST', body: form });
			const body = await res.json().catch(() => null);
			if (!res.ok) throw new Error(body?.message ?? `Error ${res.status}`);
			resultados[idx] = {
				key: estilo,
				label: STYLES[estilo].label,
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
			resultados[idx] = { key: estilo, label: STYLES[estilo].label, estado: 'error', mensaje };
		}
	}

	async function generarTodos() {
		if (!file) return;
		procesando = true;
		resultados = STYLE_KEYS.map((estilo) => ({ key: estilo, label: STYLES[estilo].label, estado: 'pendiente' }));

		// La subida (foto origen) se crea UNA vez, antes de generar nada, para que
		// los 13 estilos de este batch queden agrupados bajo la misma en la galería.
		let idSubida: number;
		try {
			const form = new FormData();
			form.append('image', file);
			const res = await fetch('/api/subida', { method: 'POST', body: form });
			const body = await res.json().catch(() => null);
			if (!res.ok) throw new Error(body?.message ?? `Error ${res.status}`);
			subidaId = body.id;
			idSubida = body.id;
		} catch (err) {
			const mensaje =
				err instanceof TypeError
					? 'No se pudo conectar con el servidor.'
					: err instanceof Error
						? err.message
						: 'Algo falló.';
			resultados = STYLE_KEYS.map((estilo) => ({ key: estilo, label: STYLES[estilo].label, estado: 'error', mensaje }));
			procesando = false;
			return;
		}

		// Secuencial a propósito: van apareciendo una por una en pantalla conforme
		// se crean, y no saturamos el space de HF con 13 llamadas concurrentes.
		for (const estilo of STYLE_KEYS) {
			await generarUno(estilo, idSubida);
		}
		procesando = false;
	}
</script>

<div class="batch">
	<h1>Batch tester — Buzito</h1>
	<p class="hint">Sube una foto y genérala en los {STYLE_KEYS.length} estilos con un clic.</p>

	<div class="campo">
		<span>Imagen</span>
		<Dropzone bind:file />
	</div>

	<button type="button" onclick={generarTodos} disabled={!file || procesando}>
		{procesando ? 'Generando…' : `Generar en los ${STYLE_KEYS.length} estilos`}
	</button>

	<ResultadoGrid items={resultados} />
</div>

<style>
	.batch {
		max-width: 900px;
		margin: 0 auto;
		padding: 1.5rem 0;
	}
	h1 {
		font-size: 1.4rem;
		margin: 0 0 0.25rem;
	}
	.hint {
		opacity: 0.75;
		font-size: 0.85rem;
		margin: 0 0 1.25rem;
	}
	.campo {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
		margin-bottom: 0.9rem;
	}
	button {
		background: rgba(255, 255, 255, 0.14);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		padding: 0.6rem 1rem;
		color: #fff;
		font: inherit;
		cursor: pointer;
	}
	button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.22);
	}
	button:disabled {
		opacity: 0.6;
		cursor: default;
	}
</style>
