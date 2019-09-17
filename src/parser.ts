"use strict";

import { Parser } from "htmlparser2";

if (!String.prototype.trim) {
  (function() {
    let rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    String.prototype.trim = function() {
      return this.replace(rtrim, "");
    };
  })();
}

type Indent = { size: number; style: string };

class SeedParser {
  code: string = "";
  depth: number = -1;
  emptyText: boolean = false;
  indentSize: number = 2;
  indentStyle: string = " ";
  stack: {tag: string, empty: boolean}[] = [];
  multiRoot: boolean = false;

  reinit() {
    this.code = "";
    this.depth = -1;
  }

  setIndent(indent: Indent) {
    this.indentSize = indent.size;
    this.indentStyle = indent.style;
  }

  newline() {
    this.code += "\n";
  }

  push(s: string) {
    this.code += s;
  }

  parseStyle(value: string): string {
    let valueArray = value.split(/\s*;+\s*/g).filter(s => !!s.length);
    return valueArray
      .map(s => {
        let arr = s.split(/\s*:\s*(.+)/).filter(s => !!s.length);
        return `"${arr.join('"=>"')}"`;
      })
      .join(";");
  }

  newTag(tag: string, attributes: { [s: string]: string }) {
    
    let klass = "";
    let style = "";
    let id = "";
    let attrs = Object.keys(attributes)
      .map(attribute => {
        let value = attributes[attribute];

        switch (attribute) {
          case "id":
            id = `id!("${id}")`;
            return false;
          case "class":
            let classes = value.split(/\s+/);
            if (classes.length) {
              klass = `class!["${classes.join('", "')}"]`;
              return false;
            }
            break;
          case "style":
            style = `style! {${this.parseStyle(value)}}`;
            return false;
          default:
            return `"${attribute}"=>"${value}"`;
        }
      })
      .filter(Boolean)
      .join("; ");
    if (attrs) {
      attrs = `attrs![${attrs}]`;
    }
    this.depth++;


    if(this.depth) {
      this.push(',');
      this.newline();
      this.indent('', 0);
    } else {
      if(this.code && !this.multiRoot) {
        this.multiRoot = true;
      }
      if (this.multiRoot){
        this.push(',');
        this.newline();
      }
    }
    this.push(`${tag}![`);
    let info = {tag: tag + this.depth, empty: true};
    [id, klass, style, attrs].forEach(macro => {
      if (macro) {
        if(!info.empty) {
          this.push(',');
        }
        info.empty = false;
        this.newline();
        this.indent(`${macro}`);
      }
    });

    this.stack.push(info);
  }

  appendText(text: string) {
    if(this.stack.length) {
      let info = this.stack[this.stack.length - 1];
      if(!info.empty) {
        this.push(',');
      }
      info.empty = false;
    }
    this.newline();
    this.indent(`"${text}"`);
  }

  closeTag() {
    let info = this.stack.pop();
    this.depth--;
    if(info && info.empty) {
      this.push(']');
    } else {
      this.newline();
      this.indent(`]`);
    }
  }

  indent(s: string, step=1) {
    this.code +=
      this.indentStyle.repeat((this.depth + step) * this.indentSize) + s || "";
  }

  indentAll() {
    const indent = this.indentStyle.repeat(this.indentSize);
    this.code = this.code.split('\n').map(line => {
      return indent + line;
    }).join('\n');
  }

  convert(html: string): string {
    this.reinit();
    let parser = new Parser(
      {
        onopentag: (
          name: string,
          attributes: { [s: string]: string }
        ): void => {
          this.newTag(name, attributes);
        },
        ontext: (rawText: string): void => {
          let text = rawText.trim();
          if (text.length) {
            this.appendText(text);
          } else {
            
          }
        },
        onclosetag: () => {
          this.closeTag();
        }
      },
      { decodeEntities: true }
    );

    parser.write(html);
    parser.end("");
    if(this.multiRoot) {
      this.indentAll();
      return `vec![\n${this.code}\n]`;
    }
    return this.code;
  }
}

export default new SeedParser();
//   this.newline();
    //   this.indent(`,`);