export namespace config {
	
	export class AppSettings {
	    output_dir: string;
	    concurrency: number;
	    proxy: string;
	    clipboard_auto_detect: boolean;
	    default_audio_format: string;
	    theme: string;
	    cookie_file: string;
	
	    static createFrom(source: any = {}) {
	        return new AppSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.output_dir = source["output_dir"];
	        this.concurrency = source["concurrency"];
	        this.proxy = source["proxy"];
	        this.clipboard_auto_detect = source["clipboard_auto_detect"];
	        this.default_audio_format = source["default_audio_format"];
	        this.theme = source["theme"];
	        this.cookie_file = source["cookie_file"];
	    }
	}

}

export namespace engine {
	
	export class UpdateResult {
	    success: boolean;
	    message: string;
	    version: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	        this.version = source["version"];
	    }
	}

}

export namespace models {
	
	export class DownloadOptions {
	    URL: string;
	    OutputDir: string;
	    Resolution: string;
	    AudioOnly: boolean;
	    AudioFmt: string;
	    Cookies: string;
	    Proxy: string;
	
	    static createFrom(source: any = {}) {
	        return new DownloadOptions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.URL = source["URL"];
	        this.OutputDir = source["OutputDir"];
	        this.Resolution = source["Resolution"];
	        this.AudioOnly = source["AudioOnly"];
	        this.AudioFmt = source["AudioFmt"];
	        this.Cookies = source["Cookies"];
	        this.Proxy = source["Proxy"];
	    }
	}
	export class DownloadProgress {
	    percent: number;
	    speed_str: string;
	    eta_str: string;
	    total_size_str: string;
	    filename: string;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new DownloadProgress(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.percent = source["percent"];
	        this.speed_str = source["speed_str"];
	        this.eta_str = source["eta_str"];
	        this.total_size_str = source["total_size_str"];
	        this.filename = source["filename"];
	        this.status = source["status"];
	    }
	}
	export class FormatOption {
	    format_id: string;
	    ext: string;
	    resolution: string;
	    height: number;
	    width: number;
	    filesize: number;
	    vcodec: string;
	    acodec: string;
	    tbr: number;
	    fps: number;
	    is_video: boolean;
	    is_audio: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FormatOption(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.format_id = source["format_id"];
	        this.ext = source["ext"];
	        this.resolution = source["resolution"];
	        this.height = source["height"];
	        this.width = source["width"];
	        this.filesize = source["filesize"];
	        this.vcodec = source["vcodec"];
	        this.acodec = source["acodec"];
	        this.tbr = source["tbr"];
	        this.fps = source["fps"];
	        this.is_video = source["is_video"];
	        this.is_audio = source["is_audio"];
	    }
	}
	export class MediaInfo {
	    id: string;
	    url: string;
	    platform: string;
	    title: string;
	    description: string;
	    uploader: string;
	    channel: string;
	    duration: number;
	    thumbnail: string;
	    formats: FormatOption[];
	    best_quality: string;
	
	    static createFrom(source: any = {}) {
	        return new MediaInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.url = source["url"];
	        this.platform = source["platform"];
	        this.title = source["title"];
	        this.description = source["description"];
	        this.uploader = source["uploader"];
	        this.channel = source["channel"];
	        this.duration = source["duration"];
	        this.thumbnail = source["thumbnail"];
	        this.formats = this.convertValues(source["formats"], FormatOption);
	        this.best_quality = source["best_quality"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace queue {
	
	export class Task {
	    id: string;
	    url: string;
	    title: string;
	    thumbnail: string;
	    platform: string;
	    options: models.DownloadOptions;
	    status: string;
	    progress: models.DownloadProgress;
	    error?: string;
	    output_path?: string;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    completed_at?: any;
	
	    static createFrom(source: any = {}) {
	        return new Task(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.url = source["url"];
	        this.title = source["title"];
	        this.thumbnail = source["thumbnail"];
	        this.platform = source["platform"];
	        this.options = this.convertValues(source["options"], models.DownloadOptions);
	        this.status = source["status"];
	        this.progress = this.convertValues(source["progress"], models.DownloadProgress);
	        this.error = source["error"];
	        this.output_path = source["output_path"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.completed_at = this.convertValues(source["completed_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

