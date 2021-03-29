"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureSitemap = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const helpers_1 = require("./helpers");
const utils_1 = require("./utils");
class Core {
    constructor(config) {
        var _a;
        this.xmlHeader = '<?xml version="1.0" encoding="UTF-8" ?>\n';
        this.xmlURLSet = `<urlset xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml">`;
        this.generateSitemap = () => __awaiter(this, void 0, void 0, function* () {
            const paths = this.nextConfigPath
                ? yield helpers_1.getPathsFromNextConfig(this.nextConfigPath)
                : helpers_1.getPaths({
                    folderPath: this.pagesDirectory,
                    rootPath: this.pagesDirectory,
                    excludeExtns: this.excludeExtensions,
                    excludeIdx: this.excludeIndex,
                });
            const [excludeFolders, excludeFiles] = utils_1.splitFoldersAndFiles(this.exclude);
            const filteredPaths = paths.filter((path) => !utils_1.findMatch(path, excludeFolders, excludeFiles));
            const sitemap = yield helpers_1.getSitemap({
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
        });
        this.writeHeader = () => __awaiter(this, void 0, void 0, function* () {
            var _b, _c;
            const xmlStyles = (_c = (_b = this.sitemapStylesheet) === null || _b === void 0 ? void 0 : _b.reduce((accum, { type, styleFile }) => accum + `<?xml-stylesheet href="${styleFile}" type="${type}" ?>\n`, '')) !== null && _c !== void 0 ? _c : '';
            fs_1.default.writeFileSync(path_1.default.resolve(this.targetDirectory, './sitemap.xml'), this.xmlHeader + xmlStyles + this.xmlURLSet, { flag: 'w' });
        });
        this.writeSitemap = ({ sitemap }) => {
            if (this.langs.length > 0) {
                sitemap.forEach((url) => {
                    this.langs.forEach((lang) => {
                        const alternateUrls = this.langs.reduce((accum, altLang) => {
                            const baseUrl = this.localizedUrl(altLang);
                            return (accum +
                                `\n        <xhtml:link rel="alternate" hreflang="${altLang}" href="${baseUrl}${url.pagePath}" />`);
                        }, '');
                        this.writeXmlUrl({
                            baseUrl: this.localizedUrl(lang),
                            url,
                            alternateUrls,
                        });
                    });
                });
            }
            else {
                sitemap.forEach((url) => {
                    this.writeXmlUrl({
                        baseUrl: this.baseUrl,
                        url,
                    });
                });
                return;
            }
        };
        this.writeXmlUrl = ({ baseUrl, url, alternateUrls }) => fs_1.default.writeFileSync(path_1.default.resolve(this.targetDirectory, './sitemap.xml'), helpers_1.getXmlUrl({ baseUrl, url, alternateUrls }), { flag: 'as' });
        this.writeFooter = () => fs_1.default.writeFileSync(path_1.default.resolve(this.targetDirectory, './sitemap.xml'), '\n</urlset>', { flag: 'as' });
        this.localizedUrl = (lang) => {
            if (lang === this.defaultLang) {
                return this.baseUrl;
            }
            else {
                return this.isSubdomain
                    ? helpers_1.getLocalizedSubdomainUrl(this.baseUrl, lang)
                    : `${this.baseUrl}/${lang}`;
            }
        };
        if (!config)
            throw new Error('Config is mandatory');
        const { baseUrl, exclude = [], excludeExtensions = [], excludeIndex = true, include = [], isSubdomain = false, isTrailingSlashRequired = false, defaultLang, langs = [], nextConfigPath, pagesConfig = {}, pagesDirectory, sitemapStylesheet = [], targetDirectory, } = config;
        this.baseUrl = baseUrl;
        this.include = include;
        this.excludeExtensions = excludeExtensions;
        this.exclude = exclude;
        this.excludeIndex = excludeIndex;
        this.isSubdomain = isSubdomain;
        this.isTrailingSlashRequired = isTrailingSlashRequired;
        this.defaultLang = (_a = defaultLang !== null && defaultLang !== void 0 ? defaultLang : langs[0]) !== null && _a !== void 0 ? _a : '';
        this.langs = langs;
        this.nextConfigPath = nextConfigPath;
        this.pagesConfig = pagesConfig;
        this.pagesDirectory = pagesDirectory;
        this.sitemapStylesheet = sitemapStylesheet;
        this.targetDirectory = targetDirectory;
    }
}
function configureSitemap(config) {
    const Sitemap = Core;
    return new Sitemap(config);
}
exports.configureSitemap = configureSitemap;
