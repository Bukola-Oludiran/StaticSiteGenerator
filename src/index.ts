import {StaticSiteGenerator} from './core/main.ts';
import {MarkdownParser, CommonMarkdownReader,} from './core/markdownParser.ts';
import {LayoutEngine} from './core/templateEngine.ts';
import type {ParsedFile, MarkdownReader} from "./core/markdownParser.ts";
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import type {markdownParsingStep, layoutRenderingStep} from "./core/main.ts"
import path from 'path';
import { pathToFileURL } from 'url';
   


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
        if(!(file === ".DS_Store")){  
            let name = file.split(".")[0]
            let content = readFileSync(path.join(templatePath, file), 'utf-8')
            if(!name || !content){
                throw new Error(`Problem reading template folder`)
            }
            layoutEngine.addTemplate(name, content)
        }
    })
}

function loadPartials (partialPath: string, layoutEngine: LayoutEngine): void{
     const files = readdirSync(partialPath)
    files.forEach((file)=>{
        if(!(file === ".DS_Store")){     
            let name = file.split(".")[0]
            let content = readFileSync(path.join(partialPath, file), 'utf-8')
            if(!name || !content){
                throw new Error(`Problem reading template folder`)
            }
            layoutEngine.addPartial(name, content)

        }
        
    })
}

async function processFilesInFolderRecursively(contentRoot: string, contentPath: string, genrator: StaticSiteGenerator, layoutEngine: LayoutEngine, markdownEngine: MarkdownParser, configData: any, outputPath: string): Promise<void>{
    
    const content = readdirSync(contentPath,  {withFileTypes: true })



    for (let file of content){  
            if (file.isDirectory()){
                await processFilesInFolderRecursively(contentRoot, `${contentPath}/${file.name}`, genrator, layoutEngine, markdownEngine, configData, outputPath)
            }
            else if(file.name.endsWith('.md')){
            let webpage = await genrator.generateSite(layoutEngine, markdownEngine, `${contentPath}/${file.name}`, configData)
            const outFile = `${outputPath}/${path.relative(contentRoot, contentPath)}/`

            mkdirSync(outFile, { recursive: true })
            writeFileSync(path.join(outFile, file.name.replace(".md", ".html")), webpage)

     }
    }

}

async function loadPlugin(p: string, generator: StaticSiteGenerator): Promise<void>{
    let pluginObject: PluginObjects 
    try{
        pluginObject = await import(pathToFileURL(path.resolve(p)).href)
    }
    catch(err){
        throw new Error(`Error importing plugin ${p}`, { cause: err })
    }

    if(pluginObject.LayoutRenderingStep){
         generator.registerLayoutRenderingStep(pluginObject.LayoutRenderingStep)
    }

   if(pluginObject.MarkDownParsingStep){
    generator.registerMarkdownParsingStep(pluginObject.MarkDownParsingStep)
}

}

function handlePassThroughs(pathRoot:string, inputPath: string, outputPath: string){
    const file = readFileSync(inputPath)
    const outFile = `${outputPath}/${path.relative(pathRoot, inputPath)}/`
    mkdirSync(outFile, { recursive: true })
    writeFileSync(outFile, file)
}


const layoutEngine = new LayoutEngine();
const markdownEngine = new MarkdownParser(CommonMarkdownReader);

const staticSiteGenerator = new StaticSiteGenerator(
    defaultMarkdownParsingStep,
    defaultLayoutRenderingStep,
);

const config = loadConfig();

const plugins = config.Plugins ?? []

if(plugins){

        for (let plugin of plugins){
        await loadPlugin(plugin, staticSiteGenerator)
    }
}

const passThroughs = config.passthorugh_files ?? []

if(passThroughs){
    for(let file of passThroughs){
        handlePassThroughs(config.input_directory, file, config.output_directory)
    }
}

let configData = {
    site: {
        title: config.site_title,
        description: config.site_description,
        author: config.site_author
    } 
}


loadTemplates(`${config.input_directory}/template`, layoutEngine)
loadPartials(`${config.input_directory}/partials`, layoutEngine)

await processFilesInFolderRecursively(`${config.input_directory}/content`,`${config.input_directory}/content`, staticSiteGenerator, layoutEngine, markdownEngine, configData, config.output_directory)









