import { Interface } from "node:readline";
import { readdirSync } from "node:fs";
import { MarkdownParser } from "./markdownParser.ts";


interface treeNode{
 
    name: string 
    type: string 
    // content: string 
    // tags: string[]
    // date: string
    // layout: string
    // url: string
    // next: string 
    // prev: string 

}

class FileNode implements treeNode{
    name: string 
    type: string 
    content: string 
    tags: string[]
    date: string
    layout: string
    url: string 
    next: string
    prev: string

    constructor( 
        name: string, 
        type: string, 
        content: string ,
        tags: string[],
        date: string,
        layout: string,
        url: string
        ){

            this.name = name
            this.type = type
            this.content = content
            this.tags = tags
            this.date = date
            this.layout = layout
            this.url = url
            this.next = ""
            this.prev = ""
    }

}

class DirNode implements treeNode {

    name: string 
    children: treeNode[]
    type: string 

    constructor(name: string, children: treeNode[], type: string){
        this.name = name
        this.children = children
        this.type = type
    }

}


class SiteModel{

    root: DirNode
    markdownParser: MarkdownParser
    tags: string []
    posts: string []


    constructor(siteRoot: string, markdownParser: MarkdownParser){
        this.root = new DirNode("root", [], "dir",)
        this.markdownParser = markdownParser
        this.tags = []
        this.posts = []

    }

    buildTree(path:string, root:DirNode = this.root, url: string [] = []): DirNode {
         const content = readdirSync(path, {withFileTypes: true })


         for (let file of content){
            if (file.isDirectory()){
                let folder = new DirNode(file.name, [], "dir", )
                url.push(file.name)
                folder = this.buildTree(path + `/${file.name}`, folder, url)
                root.children.push(folder)
                url.pop()
            }else if(file.name.endsWith('.md')){

                const filePath = url.join("/") + file.name
                const parsedFile = this.markdownParser.parseFile(filePath)
                const fileObj = new FileNode(
                    file.name, 
                    "file",
                    parsedFile.parsedContent, 
                    parsedFile.frontMatter.Tags, 
                    parsedFile.frontMatter.Date, 
                    parsedFile.layout, 
                    filePath.replace(".md", ".html"))
               root.children.push(fileObj)
            }

         }

         return root

    }

    generateCollections(): any {

    }








}