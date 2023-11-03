const fs = require("fs");
const fsUtils = require("../utils/fsUtils");
const templateUtils = require("../utils/templateUtils");

class AccountTemplate {
  static CONFIG_ITEMS = [
    "name_en",
    "name_fr",
    "name_nl",
    "text_configuration",
    "externally_managed",
    "account_range",
    "mapping_list_ranges",
  ];
  static TEMPLATE_TYPE = "accountTemplate";
  static TEMPLATE_FOLDER = fsUtils.FOLDERS[this.TEMPLATE_TYPE];
  constructor() {}

  /**
   * Process the response provided by the Silverfin API and store every detail in its corresponding file (liquid files, config file, etc)
   * @param {number} firmId
   * @param {object} template
   */
  static save(firmId, template) {
    if (templateUtils.missingLiquidCode(template)) return;
    if (!templateUtils.checkValidName(template.name_nl)) return; //TODO: Replace name_nl

    const name = template.name_nl; //TODO: Replace name_nl
    fsUtils.createTemplateFolders(this.TEMPLATE_TYPE, name);

    // Liquid files
    const mainPart = template.text;
    const textParts = templateUtils.filterParts(template);
    fsUtils.createTemplateFiles(this.TEMPLATE_TYPE, name, mainPart, textParts);

    // Liquid Test YAML
    let testContent = "# Add your Liquid Tests here";
    fsUtils.createLiquidTestFiles(this.TEMPLATE_TYPE, handle, testContent);

    // Config Json File
    let existingConfig = fsUtils.readConfig(this.TEMPLATE_TYPE, name);
    const configDetails = this.#prepareConfigDetails(template);
    const configContent = {
      id: {
        ...existingConfig?.id,
        [firmId]: template.id,
      },
      test: `tests/${name}_liquid_test.yml`,
      ...configDetails,
    };
    fsUtils.writeConfig(this.TEMPLATE_TYPE, name, configContent);
  }

  /**
   * Read all necessary files and prepare the object to be sent to the Silverfin API
   * @param {string} name The name of the template to read
   * @returns {object} The object to be sent to the Silverfin API
   */
  static read(name) {
    fsUtils.createTemplateFolders(this.TEMPLATE_TYPE, name);
    // Config.json
    const templateConfig = fsUtils.readConfig(this.TEMPLATE_TYPE, name);
    let template = this.#filterConfigItems(templateConfig);
    // Liquid
    this.#createMainLiquid(name);
    template.text = this.#readMainLiquid(name, templateConfig);
    template.text_parts = this.#readPartsLiquid(name, templateConfig);

    return template;
  }

  /** Update template's id for the corresponding firm in template's config file */
  static updateTemplateId(firmId, name, templateId) {
    let templateConfig = fsUtils.readConfig(this.TEMPLATE_TYPE, name);
    templateConfig.id[firmId] = templateId;
    fsUtils.writeConfig(this.TEMPLATE_TYPE, name, templateConfig);
  }

  static #prepareConfigDetails(template) {
    const attributes = this.CONFIG_ITEMS.reduce((acc, attribute) => {
      acc[attribute] = template[attribute];
      return acc;
    }, {});
    const textParts = templateUtils.filterParts(template);
    const configTextParts = Object.keys(textParts).reduce((acc, name) => {
      if (name) {
        acc[name] = `text_parts/${name}.liquid`;
      }
      return acc;
    }, {});
    return { ...attributes, text: "main.liquid", text_parts: configTextParts };
  }

  static #filterConfigItems(templateConfig) {
    return this.CONFIG_ITEMS.reduce((acc, attribute) => {
      if (templateConfig.hasOwnProperty(attribute)) {
        acc[attribute] = templateConfig[attribute];
      }
      return acc;
    }, {});
  }

  static #createMainLiquid(name) {
    const relativePath = `./${this.TEMPLATE_FOLDER}/${name}`;
    if (!fs.existsSync(`${relativePath}/main.liquid`)) {
      fsUtils.createLiquidFile(
        relativePath,
        "main",
        "{% comment %} MAIN PART {% endcomment %}"
      );
    }
  }

  static #readMainLiquid(name, templateConfig) {
    const mainPartPath = `./${this.TEMPLATE_FOLDER}/${name}/${templateConfig.text}`;
    return fs.readFileSync(mainPartPath, "utf-8");
  }

  static #readPartsLiquid(name, templateConfig) {
    const relativePath = `./${this.TEMPLATE_FOLDER}/${name}`;
    return Object.keys(templateConfig.text_parts).reduce((array, name) => {
      let path = `${relativePath}/${templateConfig.text_parts[name]}`;
      let content = fs.readFileSync(path, "utf-8");
      array.push({ name, content });
      return array;
    }, []);
  }
}

module.exports = { AccountTemplate };

// Example Silverfin Response
// {
//   "id": 100,
//   "marketplace_template_id": 25,
//   "account_range": null,
//   "text_configuration": null,
//   "name_en": Account template Name,
//   "text": "Liquid code",
//   "text_parts": [
//       {
//           "name": "part_1",
//           "content": "part 1 liquid code"
//       }
//   ],
//   "mapping_list_ranges": [],
//   "externally_managed": false
// }