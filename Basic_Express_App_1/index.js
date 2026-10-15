// const chalk = require("chalk")
import chalk from 'chalk';
import fs from 'fs'

let name = "Ganesh"
// console.log("dsfsdf")
console.log(chalk.blue("My  blue text"))
debugger
console.log(chalk.red("My red text"))
console.log(`${name} is 30 years old.`)
debugger
console.log(chalk.green("My green text"))
debugger


const stringText = JSON.stringify({ name: "Ganesh", age: 31 })
console.log(stringText)
console.log(JSON.parse(stringText))


let content = fs.readFileSync('./test.txt','utf-8')
// let content = fs.readFile('./test.txt','utf-8',(err,data)=>{
//     if(err){
//         console.log(err)    
//     } else {
//         console.log(data)
//     }
// })

console.log(content)
