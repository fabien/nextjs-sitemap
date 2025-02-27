export interface ICoreConstructor {
  new (config: IConfig): ICoreInterface;
}

export interface ICoreInterface {
  generateSitemap: () => Promise<void>;
}

interface IConfig {
  baseUrl: string;
  exclude?: string[];
  excludeExtensions?: string[];
  excludeIndex?: boolean;
  include?: string[];
  isSubdomain?: boolean;
  isTrailingSlashRequired?: boolean;
  defaultLang: string;
  langs: string[];
  nextConfigPath?: string;
  pagesConfig?: IPagesConfig;
  pagesDirectory: string;
  sitemapStylesheet?: ISitemapStylesheet[];
  targetDirectory: string;
}

export interface IPagesConfig {
  [key: string]: {
    priority: string;
    changefreq: string;
  };
}

export interface ISitemapStylesheet {
  type: string;
  styleFile: string;
}

export interface ISitemapSite {
  pagePath: string;
  priority: string;
  changefreq: string;
}

export interface IGetXmlUrl {
  baseUrl: string;
  url: ISitemapSite;
  alternateUrls?: string;
}

export interface IGetPathMap {
  folderPath: string;
  rootPath: string;
  excludeExtns: string[];
  excludeIdx?: boolean;
}

export interface IGetSitemap {
  paths: string[];
  include: string[];
  pagesConfig: IPagesConfig;
  isTrailingSlashRequired: boolean;
}

export interface IWriteSitemap {
  sitemap: ISitemapSite[];
}

export interface IWriteXmlUrl {
  baseUrl: string;
  url: ISitemapSite;
  alternateUrls?: string;
}

export default IConfig;
