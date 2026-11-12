import handlebars from "handlebars"


export interface TemplateProcessor{
    
    makeSafeString: (str: string) => any
    render:(template: string, data: any) => string 

} 


class HandleBarsProcessor implements TemplateProcessor{
    

    makeSafeString (str: string): any{
        return new handlebars.SafeString(str)
    }

    render (template: string, data: any): string{
        const compiledTemplate = handlebars.compile(template);
        const renderedTemplate = compiledTemplate(data);
        return renderedTemplate;  
    }



}

export {HandleBarsProcessor}
