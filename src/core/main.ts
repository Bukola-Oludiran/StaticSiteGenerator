import { LayoutEngine, renderTemplate} from "./templateEngine.ts";
import {MarkdownParser, CommonMarkdownReader} from "./markdownParser.ts";
import type {ParsedFile, MarkdownReader} from "./markdownParser.ts";
import Handlebars from "handlebars";


//Todo. Wrap Handlebars in an interface.

interface TemplateRenderHelper {
    (template: string, data: any): string;
}

interface MarkdownParsingContext {
    parser: MarkdownParser;
    reader: MarkdownReader;
    markdownURL: string;
}

interface LayoutRenderingContext {
    layoutEngine: LayoutEngine;
    template: string;
    data: any;
}


export type markdownParsingStep = (ctxObj: MarkdownParsingContext) => Promise<ParsedFile>;
export type layoutRenderingStep = (CtxObj: LayoutRenderingContext) => string;



class StaticSiteGenerator {

    markdownParsingStep: markdownParsingStep;
    layoutRenderingStep: layoutRenderingStep;
   

    constructor(
        markdownParsingStep: markdownParsingStep,
        layoutRenderingStep: layoutRenderingStep,
    
    ) {
        this.markdownParsingStep = markdownParsingStep;
        this.layoutRenderingStep = layoutRenderingStep;
    }


     registerMarkdownParsingStep(step: markdownParsingStep): void {
        this.markdownParsingStep = step;
    }
    
    registerLayoutRenderingStep(step: layoutRenderingStep): void {
        this.layoutRenderingStep = step;
    }

    async generateSite(layoutEngine: LayoutEngine, markdownEngine: MarkdownParser, markdownURL: string, configData:any): Promise<string>
    {
        const parsedMarkdown = await this.markdownParsingStep({
            parser: markdownEngine,
            reader: markdownEngine.markdownReader,
            markdownURL
        });
        const renderedLayout = this.layoutRenderingStep({
            layoutEngine,
            template: parsedMarkdown.layout,
            data: {
                ...configData,
                page: {
                ...parsedMarkdown.frontMatter
                },
                content: new Handlebars.SafeString(parsedMarkdown.parsedContent)
            }
        });
        
        return renderedLayout;
    }

}

export { StaticSiteGenerator };








