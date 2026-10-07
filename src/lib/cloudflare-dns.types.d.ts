export type CloudflareDnsRecordCreate =
	| {
			type: "MX";
			name: string;
			content: string;
			priority: number;
			ttl: number;
			proxied?: boolean;
			comment?: string;
			tags?: string[];
	  }
	| {
			type: "TXT";
			name: string;
			content: string;
			ttl: number;
			comment?: string;
			tags?: string[];
	  }	| {
			type: "CNAME";
			name: string;
			content: string;
			ttl: number;
			proxied?: boolean;
			comment?: string;
			tags?: string[];
	  };
