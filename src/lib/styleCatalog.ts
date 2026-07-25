// Catálogo de estilos del space de HuggingFace (moibe-sxm). Compartido entre
// cliente (UI del formulario) y servidor (validación + forward del multipart).
export const COLORS = [
	'red',
	'black',
	'blue',
	'golden',
	'pink',
	'green',
	'yellow',
	'purple',
	'silver',
	'white',
	'sky blue',
	'light blue',
	'royal blue',
	'navy blue',
	'orange',
	'random'
] as const;

export const HAIRSTYLES = ['ponytail', 'pigtails', 'random'] as const;

export type StyleParam = {
	name: 'outfit_color' | 'color' | 'hairstyle';
	label: string;
	options: readonly string[];
};

export type StyleDef = {
	label: string;
	params: StyleParam[];
};

export const STYLES: Record<string, StyleDef> = {
	partynight: { label: 'Party night', params: [{ name: 'outfit_color', label: 'Color', options: COLORS }] },
	babydoll: { label: 'Babydoll', params: [{ name: 'outfit_color', label: 'Color', options: COLORS }] },
	leather: { label: 'Leather', params: [] },
	stewardess: { label: 'Stewardess', params: [{ name: 'color', label: 'Color', options: COLORS }] },
	oktoberfest: { label: 'Oktoberfest', params: [] },
	ghibli: { label: 'Ghibli', params: [] },
	wildwest: { label: 'Wild West', params: [] },
	bride: { label: 'Bride', params: [] },
	swimsuit: { label: 'Swimsuit', params: [{ name: 'color', label: 'Color', options: COLORS }] },
	lingerie: { label: 'Lingerie', params: [] },
	schooluniform: { label: 'School uniform', params: [] },
	frenchmaid: { label: 'French maid', params: [] },
	cheerleader: {
		label: 'Cheerleader',
		params: [
			{ name: 'color', label: 'Color', options: COLORS },
			{ name: 'hairstyle', label: 'Peinado', options: HAIRSTYLES }
		]
	}
};

export const STYLE_KEYS = Object.keys(STYLES);
