<script lang="ts">
	import Dropzone from '$lib/Dropzone.svelte';
	import ResultadoGrid, { type ItemResultado } from '$lib/ResultadoGrid.svelte';
	import { STYLES, STYLE_KEYS } from '$lib/styleCatalog';

	// Solo tiene sentido probar parámetros en estilos que de hecho tienen alguno.
	const ESTILOS_CON_PARAMS = STYLE_KEYS.filter((k) => STYLES[k].params.length > 0);

	let file: File | null = $state(null);
	let estilo = $state(ESTILOS_CON_PARAMS[0]);
	let procesando = $state(false);
	let resultados: ItemResultado[] = $state([]);
	let subidaId: number | null = $state(null);

	$effect(() => {
		file;
		subidaId = null;
	});

	const def = $derived(STYLES[estilo]);

	// Producto cartesiano de las opciones de todos los parámetros del estilo.
	function combinaciones(): Record<string, string>[] {
		return def.params.reduce<Record<string, string>[]>(
			(acc, p) => acc.flatMap((combo) => p.options.map((opt) => ({ ...combo, [p.name]: opt }))),
			[{}]
		);
	}
	function comboKey(combo: Record<string, string>) {
		return Object.values(combo).join('|');
	}
	function comboLabel(combo: Record<string, string>) {
		return def.params.map((p) => `${p.label}: ${combo[p.name]}`).join(', ');
	}

	const totalCombos = $derived(
		def.params.reduce((n, p) => n * p.options.length, 1)
	);

	async function generarUno(combo: Record<string, string>, idSubida: number) {
		const key = comboKey(combo);
		const idx = resultados.findIndex((r) => r.key === key);
		resultados[idx] = { key, label: comboLabel(combo), estado: 'cargando' };

		const form = new FormData();
		form.append('image', file as File);
		form.append('subidaId', String(idSubida));
		for (const [nombre, valor] of Object.entries(combo)) form.append(nombre, valor);

		try {
			const res = await fetch(`/api/generar/${estilo}`, { method: 'POST', body: form });
			const body = await res.json().catch(() => null);
			if (!res.ok) throw new Error(body?.message ?? `Error ${res.status}`);
			resultados[idx] = {
				key,
				label: comboLabel(combo),
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
			resultados[idx] = { key, label: comboLabel(combo), estado: 'error', mensaje };
		}
	}

	async function generarTodos() {
		if (!file) return;
		procesando = true;
		const combos = combinaciones();
		resultados = combos.map((c) => ({ key: comboKey(c), label: comboLabel(c), estado: 'pendiente' }));

		// La subida (foto origen) se crea UNA vez, antes de generar nada, para que
		// todas las combinaciones queden agrupadas bajo la misma en la galería.
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
			resultados = combos.map((c) => ({ key: comboKey(c), label: comboLabel(c), estado: 'error', mensaje }));
			procesando = false;
			return;
		}

		// Secuencial, igual que el batch tester: no saturamos el space con llamadas
		// concurrentes, y así van apareciendo una por una conforme se generan.
		for (const combo of combos) {
			await generarUno(combo, idSubida);
		}
		procesando = false;
	}
</script>

<div class="params">
	<h1>Params tester — Buzito</h1>
	<p class="hint">Sube una foto, elige un estilo y genera todas sus combinaciones de parámetros.</p>

	<div class="campo">
		<span>Imagen</span>
		<Dropzone bind:file />
	</div>

	<label class="campo">
		<span>Estilo</span>
		<select bind:value={estilo}>
			{#each ESTILOS_CON_PARAMS as key (key)}
				<option value={key}>{STYLES[key].label}</option>
			{/each}
		</select>
	</label>

	<button type="button" onclick={generarTodos} disabled={!file || procesando}>
		{procesando ? 'Generando…' : `Generar las ${totalCombos} combinaciones`}
	</button>

	<ResultadoGrid items={resultados} />
</div>

<style>
	.params {
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
	select {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 8px;
		padding: 0.5rem 0.6rem;
		color: #fff;
		font: inherit;
	}
	/* El popup nativo del <select> lo pinta el SO con fondo blanco pase lo que pase,
	   así que las <option> necesitan su propio color oscuro. */
	select option {
		color: #1a1a1a;
		background: #fff;
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
