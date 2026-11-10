import handlebars from 'handlebars';        
import YAML from 'yaml';


function renderTemplate(template: string, data: any): string {
        const compiledTemplate = handlebars.compile(template);
        const renderedTemplate = compiledTemplate(data);
        return renderedTemplate;     
    }

class LayoutEngine{
    templateMap: Map<string, string>
    partialsMap: Map<string, string>

    constructor() {
        this.templateMap = new Map<string, string>();
        this.partialsMap = new Map<string, string>();
    }

    addTemplate(templateName: string, templateContent: string): void {
        this.templateMap.set(templateName, templateContent);
    }

    getTemplate(templateName: string): string | undefined {
        return this.templateMap.get(templateName);
    }

    addPartial(partialName: string, partialContent: string): void {
        handlebars.registerPartial(partialName, partialContent);
    }


    parseTemplate(templateName: string): {template: string, layout?: string} {
        const templateContent = this.getTemplate(templateName);
        const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
        if (!templateContent){
            throw new Error(`Template ${templateName} not found.`);
        }
        const frontMatterMatch = templateContent.match(frontMatterRegex);
        let frontMatter: any = { };
        
        if (frontMatterMatch) {
            const frontMatterString = frontMatterMatch[1];
            if (!frontMatterString) {
                throw new Error(`Front matter is empty in template: ${templateName}`);
            }
            frontMatter = YAML.parse(frontMatterString);
        }

        const templateWithoutFrontMatter = templateContent.replace(frontMatterRegex, '');

        if (frontMatter.layout) {
            return {template: templateWithoutFrontMatter, layout: frontMatter.layout};
        }
        else{
            return {template: templateWithoutFrontMatter, layout: "none"}
        }
       
    }

    renderPage(layoutName: string, data: any): string {
    const seen = new Set<string>();
    let html: string = data.content;          // the rendered Markdown body
    let name: string | undefined = layoutName;

    while (name && name !== "none") {
        if (seen.has(name)) {
            throw new Error(`Circular dependency detected in templates: ${name}`);
        }
        seen.add(name);

        const { template, layout } = this.parseTemplate(name);
        html = renderTemplate(template, {
            ...data,                                     // site, page: available at every layer
            content: new handlebars.SafeString(html)     // the layer inside this one
        });
        name = layout;
    }
    return html;
}
}

export { LayoutEngine, renderTemplate };