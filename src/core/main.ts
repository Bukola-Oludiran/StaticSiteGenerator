import { LayoutEngine, renderTemplate} from "./templateEngine.ts";
import {MarkdownParser, CommonMarkdownReader} from "./markdownParser.ts";
import type {ParsedFile, MarkdownReader} from "./markdownParser.ts";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

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
}

interface TemplateRenderingContext {
    helper: TemplateRenderHelper;
    template: string;
    data: any;
}

export type markdownParsingStep = (ctxObj: MarkdownParsingContext) => Promise<ParsedFile>;
export type layoutRenderingStep = (CtxObj: LayoutRenderingContext) => string;
export type templateRenderingStep = (CtxObj: TemplateRenderingContext) => string;


class StaticSiteGenerator {

    markdownParsingStep: markdownParsingStep;
    layoutRenderingStep: layoutRenderingStep;
    templateRenderingStep: templateRenderingStep;

    constructor(
        markdownParsingStep: markdownParsingStep,
        layoutRenderingStep: layoutRenderingStep,
        templateRenderingStep: templateRenderingStep
    ) {
        this.markdownParsingStep = markdownParsingStep;
        this.layoutRenderingStep = layoutRenderingStep;
        this.templateRenderingStep = templateRenderingStep;
    }


     registerMarkdownParsingStep(step: markdownParsingStep): void {
        this.markdownParsingStep = step;
    }
    
    registerLayoutRenderingStep(step: layoutRenderingStep): void {
        this.layoutRenderingStep = step;
    }

    registerTemplateRenderingStep(step: templateRenderingStep): void {
        this.templateRenderingStep = step;
    }

    async generateSite(layoutEngine: LayoutEngine, markdownEngine: MarkdownParser, markdownURL: string): Promise<string>
    {
        const parsedMarkdown = await this.markdownParsingStep({
            parser: markdownEngine,
            reader: markdownEngine.markdownReader,
            markdownURL
        });
        const renderedLayout = this.layoutRenderingStep({
            layoutEngine,
            template: parsedMarkdown.layout
        });
        //TODO: Remember to use context from config as well
        const finalOutput = this.templateRenderingStep({
            helper: renderTemplate,
            template: renderedLayout,
            data: parsedMarkdown.parsedContent
            //TODO: Format the context object properly
        });
        return finalOutput;
    }

}

export { StaticSiteGenerator };








