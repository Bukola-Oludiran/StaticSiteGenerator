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

    renderLayout(templateName: string): string {
        const seenTemplates = new Set<string>();

        const recursiveRender = (templateName: string): string =>{
            if (seenTemplates.has(templateName)){
                throw new Error(`Circular dependency detected in templates: ${templateName}`);
            }
            seenTemplates.add(templateName);
            const {template, layout} = this.parseTemplate(templateName);

            if (layout && layout !== "none") {
                const parentTemplateContent = this.getTemplate(layout);
                if (!parentTemplateContent) {
                    throw new Error(`Parent template ${layout} not found for template ${templateName}.`);
                }
                const renderedParentTemplate = recursiveRender(layout);
                return renderTemplate(renderedParentTemplate, { content: template });
            }

            return template;

    }
    return recursiveRender(templateName);
    }

}

export { LayoutEngine, renderTemplate };