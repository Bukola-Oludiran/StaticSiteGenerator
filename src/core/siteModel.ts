import { Interface } from "node:readline";
import { readdirSync } from "node:fs";
import { MarkdownParser } from "./markdownParser.ts";


interface treeNode{
 
    name: string 
    children: treeNode[]
    type: string 
    content: string 
    tags: string[]
    date: string
    layout: string
    url: string 

}

class SiteNode implements treeNode{
    name: string 
    children: treeNode[]
    type: string 
    content: string 
    tags: string[]
    date: string
    layout: string
    url: string 

    constructor( 
        name: string, 
        children: treeNode[],
        type: string, 
        content: string ,
        tags: string[],
        date: string,
        layout: string,
        url: string
        ){

            this.name = name
            this.children = children
            this.type = type
            this.content = content
            this.tags = tags
            this.date = date
            this.layout = layout
            this.url = url
    }

}


class SiteModel{

    root: treeNode
    markdownParser: MarkdownParser

    constructor(siteRoot: string, markdownParser: MarkdownParser){
        this.root = new SiteNode("root", [], "dir", "", [], "", "", "/")
        this.markdownParser = markdownParser

    }

    buildTree(path:string, root:SiteNode = this.root, url: string [] = []): SiteNode {
         const content = readdirSync(path, {withFileTypes: true })


         for (let file of content){
            if (file.isDirectory()){
                let folder = new SiteNode(file.name, [], "dir", "", [], "", "", "" )
                url.push(file.name)
                folder = this.buildTree(path + `/${file.name}`, folder, url)
                root.children.push(folder)
                url.pop()
            }else if(file.name.endsWith('.md')){

                const filePath = url.join("/") + file.name
                const parsedFile = this.markdownParser.parseFile(filePath)
                const fileObj = new SiteNode(file.name, [], "file", parsedFile.parsedContent, parsedFile.frontMatter.Tags, parsedFile.frontMatter.Date, parsedFile.layout, filePath.replace(".md", ".html"))
               root.children.push(fileObj)
            }

         }

         return root

    }
}