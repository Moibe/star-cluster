<script lang="ts">
	import { STYLES, STYLE_KEYS } from '$lib/styleCatalog';

	let estilo = $state(STYLE_KEYS[0]);
	let fileInput: HTMLInputElement | undefined = $state();
	let valoresParam: Record<string, string> = $state({});
	let cargando = $state(false);
	let errorMsg = $state('');
	let previewUrl = $state('');
	let archivoGuardado = $state('');

	const def = $derived(STYLES[estilo]);

	async function generar(e: SubmitEvent) {
		e.preventDefault();
		errorMsg = '';
		const file = fileInput?.files?.[0];
		if (!file) {
			errorMsg = 'Selecciona una imagen primero.';
			return;
		}

		const form = new FormData();
		form.append('image', file);
		for (const p of def.params) {
			const v = valoresParam[p.name];
			if (v) form.append(p.name, v);
		}

		cargando = true;
		try {
			const res = await fetch(`/api/generar/${estilo}`, { method: 'POST', body: form });
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(body?.message ?? `Error ${res.status}`);
			}
			archivoGuardado = res.headers.get('x-archivo') ?? '';
			const blob = await res.blob();
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			previewUrl = URL.createObjectURL(blob);
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Algo falló generando la imagen.';
		} finally {
			cargando = false;
		}
	}
</script>

<div class="generar">
	<h1>Generar imagen — Buzito</h1>
	<p class="hint">Sube una foto, elige un estilo y genera.</p>

	<form onsubmit={generar}>
		<label class="campo">
			<span>Imagen</span>
			<input type="file" accept="image/*" bind:this={fileInput} />
		</label>

		<label class="campo">
			<span>Estilo</span>
			<select bind:value={estilo}>
				{#each STYLE_KEYS as key (key)}
					<option value={key}>{STYLES[key].label}</option>
				{/each}
			</select>
		</label>

		{#each def.params as p (p.name)}
			<label class="campo">
				<span>{p.label}</span>
				<select bind:value={valoresParam[p.name]}>
					<option value="">(default)</option>
					{#each p.options as opt (opt)}
						<option value={opt}>{opt}</option>
					{/each}
				</select>
			</label>
		{/each}

		<button type="submit" disabled={cargando}>
			{cargando ? 'Generando…' : 'Generar'}
		</button>
	</form>

	{#if errorMsg}
		<p class="error">{errorMsg}</p>
	{/if}

	{#if previewUrl}
		<div class="resultado">
			<img src={previewUrl} alt="Resultado generado" />
			{#if archivoGuardado}
				<p class="hint">Guardado como <code>{archivoGuardado}</code></p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.generar {
		max-width: 480px;
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
	form {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	.campo {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}
	input,
	select {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 8px;
		padding: 0.5rem 0.6rem;
		color: #fff;
		font: inherit;
	}
	/* El popup nativo del <select> lo pinta el SO con fondo blanco pase lo que pase,
	   así que las <option> necesitan su propio color oscuro (si no, heredan el blanco
	   del select y quedan invisibles salvo la fila resaltada). */
	select option {
		color: #1a1a1a;
		background: #fff;
	}
	button {
		margin-top: 0.5rem;
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
	.error {
		color: #ffd3d3;
		margin-top: 1rem;
	}
	.resultado {
		margin-top: 1.5rem;
	}
	.resultado img {
		max-width: 100%;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.25);
	}
	.resultado code {
		font-size: 0.75rem;
		opacity: 0.8;
	}
</style>
