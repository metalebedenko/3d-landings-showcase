# Three websites for ordering custom parts

[По-русски](README.md)

These Russian-language demos help a customer describe a manufacturing job. One also gives a rough estimate from an STL model. [See the opening screen](docs/preview.png).

| Demo | What to try |
|---|---|
| [PlastFactory](sites/plastfactory/index.html) | Describe a broken part that needs replacing. |
| [SilikonForms](sites/silikonforms/index.html) | Plan a trial batch and try the [STL calculator](sites/silikonforms/calc/kalkulyator.html). |
| [TechProto3D](sites/techproto3d/index.html) | Specify what a functional prototype needs to do. |

## Try the interactive version

With Python 3 installed, run this in the project directory and open [the local demo](http://127.0.0.1:8000). The HTML links above open source files on GitHub.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

The request stays in the page and the calculator reads the selected model in the browser. Use made-up contact details and a non-confidential model. Prices and lead times illustrate the interface. A real manufacturing quote needs a separate assessment.

[Security and privacy](SECURITY.md) · [Image and font sources](docs/asset-sources.json) · [Third-party notices](THIRD_PARTY_NOTICES.md) · [MIT licence for the original work](LICENSE)
