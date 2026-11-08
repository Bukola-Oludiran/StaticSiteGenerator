import { LayoutEngine, renderTemplate} from "./templateEngine.ts";
import {MarkdownParser, CommonMarkdownReader} from "./markdownParser.ts";
import type {ParsedFile, MarkdownReader} from "./markdownParser.ts";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

interface TemplateRenderHelper {
    (template: string, data: any): string;
}

interface MarkdownParsingContext {
    parser: typeof MarkdownParser;
    reader: MarkdownReader;
    markdownURL: string;
}

interface LayoutRenderingContext {
    layoutEngine: typeof LayoutEngine;
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

    async generateSite(layoutEngine: typeof LayoutEngine, markdownEngine: MarkdownReader): Promise<string>
    {
        const parsedMarkdown = await this.markdownParsingStep({
            parser: MarkdownParser,
            reader: markdownEngine,
            markdownURL: "path/to/markdown/file.md"
        });
        const renderedLayout = this.layoutRenderingStep({
            layoutEngine,
            template: parsedMarkdown.layout
        });
        const finalOutput = this.templateRenderingStep({
            helper: renderTemplate,
            template: renderedLayout,
            data: parsedMarkdown.parsedContent
        });
        return finalOutput;
    }

}

export { StaticSiteGenerator };








