import {StaticSiteGenerator} from './core/main.ts';
import {MarkdownParser, CommonMarkdownReader,} from './core/markdownParser.ts';
import {LayoutEngine} from './core/templateEngine.ts';
import type {ParsedFile, MarkdownReader} from "./core/markdownParser.ts";
import { readFileSync, readdirSync, writeFileSync } from "fs";


interface ConfigSchema{
    "input_directory": string,
    "output_directory": string,
    "passthorugh_files": string[],
    "default_template": string,
    "site_title": string,
    "site_description": string,
    "site_author": string,
    "Plugins": string[],
}


async function defaultMarkdownParsingStep(ctxObj: {parser: MarkdownParser, reader: MarkdownReader, markdownURL: string}): Promise<ParsedFile> {
    return ctxObj.parser.parseFile(ctxObj.markdownURL);
}

function defaultLayoutRenderingStep(ctxObj: {layoutEngine: LayoutEngine, template: string}): string {
    return ctxObj.layoutEngine.renderLayout(ctxObj.template);
}

function defaultTemplateRenderingStep(ctxObj: {helper: (template: string, data: any) => string, template: string, data: any}): string {
    return ctxObj.helper(ctxObj.template, ctxObj.data);
} 

function loadConfig(): ConfigSchema {
    const configPath = './config.json';
    try {
        const configContent = readFileSync(configPath, 'utf-8');
        return JSON.parse(configContent);
    } catch (error) {
        throw new Error(`Error loading configuration from ${configPath}:` + (error instanceof Error ? error.message : String(error)));  
    }
}

function loadTemplates (templatePath:string, layoutEngine: LayoutEngine): void{
    const files = readdirSync(templatePath)
    files.forEach((file)=>{
        let name = file.split(".")[0]
        let content = readFileSync(file, 'utf-8')
        if(!name || !content){
            throw new Error(`Problem reading template folder`)
        }
        layoutEngine.addTemplate(name, content)
    })
}

function loadPartials (partialPath: string, layoutEngine: LayoutEngine): void{
     const files = readdirSync(partialPath)
    files.forEach((file)=>{
        let name = file.split(".")[0]
        let content = readFileSync(file, 'utf-8')
        if(!name || !content){
            throw new Error(`Problem reading template folder`)
        }
        layoutEngine.addPartial(name, content)
    })
}

function processFilesInFolderRecursively(contentPath: string, genrator: StaticSiteGenerator, layoutEngine: LayoutEngine, markdownEngine: MarkdownParser): void{
    
    const content = readdirSync(contentPath,  {withFileTypes: true })

    content.forEach(async (file)=>{
        if (file.isDirectory()){
            processFilesInFolderRecursively(`contentPath/${file.name}`, genrator, layoutEngine, markdownEngine)
        }
        else{
           let webpage = await genrator.generateSite(layoutEngine, markdownEngine, `contentPath/${file.name}`)
           writeFileSync(`contentPath/${file.name}`, webpage)
        }
    })

}



const layoutEngine = new LayoutEngine();
const markdownEngine = new MarkdownParser(CommonMarkdownReader);

const staticSiteGenerator = new StaticSiteGenerator(
    defaultMarkdownParsingStep,
    defaultLayoutRenderingStep,
    defaultTemplateRenderingStep
);

const config = loadConfig();



loadTemplates(`${config.input_directory}/template`, layoutEngine)
loadPartials(`${config.input_directory}/partials`, layoutEngine)

processFilesInFolderRecursively(`${config.input_directory}/partials`, staticSiteGenerator, layoutEngine, markdownEngine)









