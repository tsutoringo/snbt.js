# snbt.js
(Minecraft Wiki - SNBT)[https://minecraft.fandom.com/wiki/NBT_format#SNBT_format]

## Example
### Parse
```JavaScript
import SNBT from './index.js';

let snbt = `{
  display:{
    Name:'{"text":"Apple"}',
    Lore:['{"text":"これはりんご"}']
  }
}`

snbt = SNBT.parse(snbt);

console.log(snbt);
```

### format
```JavaScript
import SNBT from './index.js';

let snbt = `{display:{Name:'{"text":"Apple"}',Lore:['{"text":"これはりんご"}']}}`

snbt = SNBT.stringify(
  SNBT.parse(snbt),
  {
    indent: '\t'
  }
);

console.log(snbt);
```

## 参考
[Sifue Blog](https://sifue.hatenablog.com/entry/20120218/1329588477)
