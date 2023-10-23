Trocha dokumentace snad neuškodí :D

## server v Rustu

Je tu server napsaný v Rustu (přes knihovnu warp), který do sebe zabalí zdrojáky stránky ve složce html a obrázky ve složce img a pak je umí vracet klientovi.
Https nemá, ale počítám s nějakou proxy, takže to snad není potřeba řešit. Poslouchá na localhostovi na portu 3752.

## seznam endpointů

endpoint | co tam je
--- | ---
/ | stránka se vším, co tam je
/anotace/`den`/`id` | stejné jako `/`, ale po načtení harmonogramu "otevře" anotaci pro `den/id`
/harmonogram | stránka jen s harmonogramem
/harmonogram/anotace/`den`/`id` | `/harmonogram` s `/anotace/den/id`
/main.css | hlavní css soubor
/main.js | hlavní js soubor (teď v něm je kreslení vrstevnic)
/harmonogram.js | načítá harmonogram
/img/title.png | obrázek s nadpisem (jen VRCHOL, "SYMPOSION GJK" je text)
/img/icon.png | ikonka (ta se ještě musí udělat!)

Nové soubory (další obrázky, css, ...) se musí přidat ručně :/.

## mazátko whitespace v Pythonu

`clean_whitespace.py` projde všechny soubory ve složce fhtml (= formatted html) a do jejich ekvivalentů ve složce html zapíše ten samý kód, ale bez tabulátorů a odřádkování.
Proto upravujte jen fhtml. Mazáním těchto znaků se šetří trocha množství dat přenesená přes internet.
