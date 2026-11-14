import { readdirSync } from "node:fs";
import { MarkdownParser } from "./markdownParser.ts";

interface tags{
[index: string]: string []
}


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
    tags: tags
    posts: string []


    constructor(siteRoot: string, markdownParser: MarkdownParser){
        this.root = new DirNode("root", [], "dir",)
        this.markdownParser = markdownParser
        this.tags = {}
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

                const filePath = `${path}/` + url.join("/") + file.name
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

    generateCollections(root: DirNode = this.root): any {
        const posts:string [] = []
        const tags:tags = {}


        function dfs(root:DirNode){
            const curr = root
            const dirs = []

            for (let item of curr.children){
                if (item instanceof DirNode){
                    dirs.push(item)
                }
                else if (item instanceof FileNode){
                    posts.push(item.url)
                    const tagObj = item.tags
                    for(let idx of tagObj){

                        if(idx in tags){
                            tags[idx]?.push(item.url)
                        //TODO: enforce tag and frontmatter schema
                    }
                    else{
                        tags[idx] = [item.url]
                    }
                }
            

                }
            }

            for (let item of dirs){
                        dfs(item)
           }

        }

        dfs(root)
        this.tags = tags
        this.posts = posts

    }


    prefillLinks(root:DirNode = this.root){
        const maxLength = this.posts.length
        const postList = this.posts

        let idx = 0

        

        function dfs(root:DirNode){
            const curr = root

            for(let item of curr.children){
                if (item instanceof FileNode){
                    let backward = Math.max(idx - 1, 0)
                    let forward = Math.min(idx + 1, maxLength - 1) 

                    item.prev = postList[backward] || " "
                    item.next = postList[forward] || " "

                    idx += 1
                } 
                else if(item instanceof DirNode){
                    dfs(item)
                }
            }

            dfs(root)


        }

    }


    //TODO: Write the render function
    //TODO: Create the Hooks
    //TODO: Refactor: Get Rid of Main.ts
    //TODO: Make use of the HandleBars interface
    //TODO: Try to write tests 

}


