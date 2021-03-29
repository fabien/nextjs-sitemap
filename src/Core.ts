import fs from 'fs';
import path from 'path';
import {
  getLocalizedSubdomainUrl,
  getPaths,
  getPathsFromNextConfig,
  getSitemap,
  getXmlUrl,
} from './helpers';
import IConfig, {
  ICoreConstructor,
  ICoreInterface,
  IPagesConfig,
  ISitemapSite,
  ISitemapStylesheet,
  IWriteSitemap,
  IWriteXmlUrl,
} from './types';
import { splitFoldersAndFiles, findMatch } from './utils';

class Core implements ICoreInterface {
  private xmlHeader = '<?xml version="1.0" encoding="UTF-8" ?>\n';
  private xmlURLSet = `<urlset xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

  private baseUrl: string;
  private exclude: string[];
  private excludeExtensions: string[];
  private excludeIndex: boolean;
  private include: string[];
  private isSubdomain: boolean;
  private isTrailingSlashRequired: boolean;
  private defaultLang: string;
  private langs: string[];
  private nextConfigPath?: string;
  private pagesConfig: IPagesConfig;
  private pagesDirectory: string;
  private sitemapStylesheet: ISitemapStylesheet[];
  private targetDirectory: string;

  constructor(config: IConfig) {
    if (!config) throw new Error('Config is mandatory');

    const {
      baseUrl,
      exclude = [],
      excludeExtensions = [],
      excludeIndex = true,
      include = [],
      isSubdomain = false,
      isTrailingSlashRequired = false,
      defaultLang,
      langs = [],
      nextConfigPath,
      pagesConfig = {},
      pagesDirectory,
      sitemapStylesheet = [],
      targetDirectory,
    } = config;

    this.baseUrl = baseUrl;
    this.include = include;
    this.excludeExtensions = excludeExtensions;
    this.exclude = exclude;
    this.excludeIndex = excludeIndex;
    this.isSubdomain = isSubdomain;
    this.isTrailingSlashRequired = isTrailingSlashRequired;
    this.defaultLang = defaultLang ?? langs[0] ?? '';
    this.langs = langs;
    this.nextConfigPath = nextConfigPath;
    this.pagesConfig = pagesConfig;
    this.pagesDirectory = pagesDirectory;
    this.sitemapStylesheet = sitemapStylesheet;
    this.targetDirectory = targetDirectory;
  }

  public generateSitemap = async (): Promise<void> => {
    const paths: string[] = this.nextConfigPath
      ? await getPathsFromNextConfig(this.nextConfigPath)
      : getPaths({
          folderPath: this.pagesDirectory,
          rootPath: this.pagesDirectory,
          excludeExtns: this.excludeExtensions,
          excludeIdx: this.excludeIndex,
        });

    const [excludeFolders, excludeFiles] = splitFoldersAndFiles(this.exclude);
    const filteredPaths: string[] = paths.filter(
      (path: string) => !findMatch(path, excludeFolders, excludeFiles),
    );

    const sitemap: ISitemapSite[] = await getSitemap({
      paths: filteredPaths,
      include: this.include,
      pagesConfig: this.pagesConfig,
      isTrailingSlashRequired: this.isTrailingSlashRequired,
    });

    this.writeHeader();
    this.writeSitemap({
      sitemap,
    });
    this.writeFooter();
  };

  private writeHeader = async (): Promise<void> => {
    const xmlStyles =
      this.sitemapStylesheet?.reduce(
        (accum: string, { type, styleFile }: ISitemapStylesheet): string =>
          accum + `<?xml-stylesheet href="${styleFile}" type="${type}" ?>\n`,
        '',
      ) ?? '';

    fs.writeFileSync(
      path.resolve(this.targetDirectory, './sitemap.xml'),
      this.xmlHeader + xmlStyles + this.xmlURLSet,
      { flag: 'w' },
    );
  };

  private writeSitemap = ({ sitemap }: IWriteSitemap): void => {
    if (this.langs.length > 0) {
      sitemap.forEach((url: ISitemapSite): void => {
        this.langs.forEach((lang: string): void => {
          const alternateUrls = this.langs.reduce(
            (accum: string, altLang: string): string => {
              const baseUrl: string = this.localizedUrl(altLang);
              return (
                accum +
                `\n        <xhtml:link rel="alternate" hreflang="${altLang}" href="${baseUrl}${url.pagePath}" />`
              );
            },
            '',
          );
          this.writeXmlUrl({
            baseUrl: this.localizedUrl(lang),
            url,
            alternateUrls,
          });
        });
      });
    } else {
      sitemap.forEach((url: ISitemapSite): void => {
        this.writeXmlUrl({
          baseUrl: this.baseUrl,
          url,
        });
      });
      return;
    }
  };

  private writeXmlUrl = ({ baseUrl, url, alternateUrls }: IWriteXmlUrl): void =>
    fs.writeFileSync(
      path.resolve(this.targetDirectory, './sitemap.xml'),
      getXmlUrl({ baseUrl, url, alternateUrls }),
      { flag: 'as' },
    );

  private writeFooter = (): void =>
    fs.writeFileSync(
      path.resolve(this.targetDirectory, './sitemap.xml'),
      '\n</urlset>',
      { flag: 'as' },
    );

  private localizedUrl = (lang): string => {
    if (lang === this.defaultLang) {
      return this.baseUrl;
    } else {
      return this.isSubdomain
        ? getLocalizedSubdomainUrl(this.baseUrl, lang)
        : `${this.baseUrl}/${lang}`;
    }
  };
}

export function configureSitemap(config: IConfig): ICoreInterface {
  const Sitemap: ICoreConstructor = Core;
  return new Sitemap(config);
}
