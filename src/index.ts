import {StaticSiteGenerator} from './core/main.ts';
import {MarkdownParser, CommonMarkdownReader,} from './core/markdownParser.ts';
import {LayoutEngine} from './core/templateEngine.ts';
import type {ParsedFile, MarkdownReader} from "./core/markdownParser.ts";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import type {markdownParsingStep, layoutRenderingStep} from "./core/main.ts"
import path from 'path';


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


interface PluginObjects{
    MarkDownParsingStep: markdownParsingStep,
    LayoutRenderingStep: layoutRenderingStep,
}


async function defaultMarkdownParsingStep(ctxObj: {parser: MarkdownParser, reader: MarkdownReader, markdownURL: string}): Promise<ParsedFile> {
    return ctxObj.parser.parseFile(ctxObj.markdownURL);
}

function defaultLayoutRenderingStep(ctxObj: {layoutEngine: LayoutEngine, template: string, data: any}): string {
    return ctxObj.layoutEngine.renderPage(ctxObj.template, ctxObj.data);
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
        let content = readFileSync(path.join(templatePath, file), 'utf-8')
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
        let content = readFileSync(path.join(partialPath, file), 'utf-8')
        if(!name || !content){
            throw new Error(`Problem reading template folder`)
        }
        layoutEngine.addPartial(name, content)
    })
}

function processFilesInFolderRecursively(contentRoot: string, contentPath: string, genrator: StaticSiteGenerator, layoutEngine: LayoutEngine, markdownEngine: MarkdownParser, configData: any, outputPath: string): void{
    
    const content = readdirSync(contentPath,  {withFileTypes: true })

    content.forEach(async (file)=>{
        if (file.isDirectory()){
            processFilesInFolderRecursively(contentRoot, `${contentPath}/${file.name}`, genrator, layoutEngine, markdownEngine, configData, outputPath)
        }
        else{
           let webpage = await genrator.generateSite(layoutEngine, markdownEngine, `${contentPath}/${file.name}`, configData)
           const outFile = `${outputPath}/${path.relative(contentRoot, contentPath)}/`

           mkdirSync(outFile, { recursive: true })
           writeFileSync(path.join(outFile, file.name.replace(".md", ".html")), webpage)
        }
    })

}

async function loadPlugin(path: string, generator: StaticSiteGenerator): Promise<void>{
    let pluginObject: PluginObjects 
    try{
        pluginObject  = await import(path)
    }
    catch(err){
        throw new Error("Error importing plugin")
    }

    staticSiteGenerator.registerLayoutRenderingStep(pluginObject.LayoutRenderingStep)
    staticSiteGenerator.registerMarkdownParsingStep(pluginObject.MarkDownParsingStep)
}


const layoutEngine = new LayoutEngine();
const markdownEngine = new MarkdownParser(CommonMarkdownReader);

const staticSiteGenerator = new StaticSiteGenerator(
    defaultMarkdownParsingStep,
    defaultLayoutRenderingStep,
);

const config = loadConfig();

const plugins = config.Plugins

plugins.forEach((plugin)=>{
    loadPlugin(plugin, staticSiteGenerator)
})

let configData = {
    site: {
        title: config.site_title,
        description: config.site_description,
        author: config.site_author
    } 
}


loadTemplates(`${config.input_directory}/template`, layoutEngine)
loadPartials(`${config.input_directory}/partials`, layoutEngine)

processFilesInFolderRecursively(`${config.input_directory}/content`,`${config.input_directory}/content`, staticSiteGenerator, layoutEngine, markdownEngine, configData, config.output_directory)









