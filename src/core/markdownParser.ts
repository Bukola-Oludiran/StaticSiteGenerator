import * as commonmark from 'commonmark'
import YAML from 'yaml'
import { readFile } from 'fs/promises'


export interface ParsedFile {
    frontMatter: {
        Title: string
        Date: string
        Tags: string[]
    }
    parsedContent: string
    layout: string
    }

export interface MarkdownReader{
    
    parseMarkdown(markdown: string): string
}


class CommonMarkdownReader implements MarkdownReader {
    markdownReader: any
    markdownWriter: any

    constructor() {
        this.markdownReader = new commonmark.Parser()
        this.markdownWriter = new commonmark.HtmlRenderer()
    }

    parseMarkdown(markdown: string): string {
        let content = this.markdownReader.parse(markdown)
        let htmlContent = this.markdownWriter.render(content)
        return htmlContent
    }
}


class MarkdownParser { 
    markdownReader: MarkdownReader
   

    constructor (Reader: new ()=> MarkdownReader) {
        this.markdownReader = new Reader()

    }   

    parseMarkdown(markdown: string): string{
        let content = this.markdownReader.parseMarkdown(markdown)
        return content

    }

    parseYaml(yaml: string): any {
        let FrontMatter = YAML.parse(yaml)
        return FrontMatter
    }

    async parseFile(url: string): Promise<ParsedFile> {
        try{
        const file = await readFile(url, 'utf-8')
        const frontMatterRegex = /^---\n([\s\S]*?)\n---/
        const frontMatterMatch = file.match(frontMatterRegex)
        let frontMatter: any = {}
        let content: string

        if (frontMatterMatch) {
            const frontMatterString = frontMatterMatch[1]
            if (!frontMatterString) {
                throw new Error(`Front matter is empty in file: ${url}`)
            }
            frontMatter = this.parseYaml(frontMatterString)
            content = file.replace(frontMatterRegex, '').trim()
        }
        else {
            throw new Error(`No front matter found in file: ${url}`)
        }

        let parsedContent: string

        try { 
            parsedContent = this.parseMarkdown(content)
        } 
        catch (error) {

            throw new Error(`Error parsing markdown content in file: ${url}. Error: ${error}`)
        }

        return { 
            frontMatter: {
                Title: frontMatter.Title || 'Untitled',
                Date: frontMatter.Date || new Date().toISOString(),
                Tags: frontMatter.Tags || []
        }, parsedContent, layout: frontMatter.Layout || 'default' }
    }
    catch (error) {
        throw new Error(`Error reading file: ${url}. Error: ${error}`)
    }

    }

}

export { MarkdownParser, CommonMarkdownReader,}
