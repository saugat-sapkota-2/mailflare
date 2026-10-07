declare module "parse-srcset" {
	export default function parse(source: string): Array<{ url: string; w?: number; h?: number; d?: number }>;
}
