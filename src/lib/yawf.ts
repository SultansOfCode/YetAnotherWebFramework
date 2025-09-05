interface YAWFData {
  [key: string]: any;
};

type YAWFText = Text & {
  __yawfOriginalData: string;
};

interface YAWFModel {
  [key: string]: {
    updater: HTMLInputElement | null,
    elements: Array<HTMLInputElement | YAWFText>
  };
};

type YAWFOptions = {
  el: string;
  data?: YAWFData;
};

const MOUSTACHE_REGEX = /\{\{([^\{\}]*?)}\}/gi;

export class YAWF {
  #data: YAWFData = {};
  #model: YAWFModel = {};

  el: HTMLElement | null = null;
  data: YAWFData = {};

  constructor({ el, data }: YAWFOptions) {
    this.el = document.getElementById(el);

    this.#setupData(data ?? {});

    this.#traverse(this.el as ChildNode);

    this.#populateData();
  }

  #isObject(value: object): boolean {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  #setupData(data: object): void {
    if (!this.#isObject(data)) {
      return;
    }

    this.#data = data;

    this.data = new Proxy(this.#data, {
      get: (target: YAWFData, p: string, _: any): any => {
        return target[p];
      },
      set: (target: YAWFData, p: string, newValue: any, _: any): boolean => {
        target[p] = newValue;

        this.#updateModelInteractors(p);

        return true;
      },
    });
  }

  #traverse(el: ChildNode): void {
    if (!el) {
      return;
    }

    for (const child of el.childNodes) {
      if (child instanceof HTMLInputElement === true) {
        this.#initializeInput(child as HTMLInputElement);
      }
      else if (child instanceof Text === true) {
        this.#initializeText(child as Text);
      }
      else {
        this.#traverse(child);
      }
    }
  }

  #populateData(): void {
    for (const key of Object.keys(this.#data)) {
      this.#updateModelInteractors(key);
    }
  }

  #initializeInput(input: HTMLInputElement): void {
    handleYawfModel: {
      if (input.hasAttribute('yawf-model') === true) {
        const model: string = input.getAttribute('yawf-model')! as string;

        if (Object.prototype.hasOwnProperty.call(this.#data, model) === false) {
          break handleYawfModel;
        }

        if (Object.prototype.hasOwnProperty.call(this.#model, model) === false) {
          this.#model[model] = {
            updater: null,
            elements: []
          };
        }

        this.#model[model].elements.push(input);

        input.addEventListener('input', (_: Event) => {
          this.#model[model].updater = input;

          this.data[model] = input.value;
        });
      }
    }
  }

  #initializeText(text: Text): void {
    let hasModel = false;

    for (const match of text.data.matchAll(MOUSTACHE_REGEX)) {
      const model = match[1].trim();

      if (Object.prototype.hasOwnProperty.call(this.#data, model) === false) {
        continue;
      }

      if (hasModel === false) {
        hasModel = true;
      }

      if (Object.prototype.hasOwnProperty.call(this.#model, model) === false) {
        this.#model[model] = {
          updater: null,
          elements: []
        };
      }

      this.#model[model].elements.push(text as YAWFText);
    }

    if (hasModel === true) {
      (text as YAWFText).__yawfOriginalData = text.data;
    }
  }

  #updateModelInteractors(model: string): void {
    if (Object.prototype.hasOwnProperty.call(this.#model, model) === false) {
      return;
    }

    for (const element of this.#model[model].elements) {
      if (element === this.#model[model].updater) {
        continue;
      }

      if (element instanceof HTMLInputElement === true) {
        element.value = this.#data[model];
      }
      else if (element instanceof Text === true) {
        this.#updateText(element as YAWFText);
      }
    }

    this.#model[model].updater = null;
  }

  #updateText(text: YAWFText): void {
    let data = text.__yawfOriginalData;
    let modified = false;

    for (const match of text.__yawfOriginalData.matchAll(MOUSTACHE_REGEX)) {
      const model = match[1].trim();

      if (Object.prototype.hasOwnProperty.call(this.#data, model) === false) {
        continue;
      }

      if (modified === false) {
        modified = true;
      }

      data = data.replace(match[0], this.#data[model]);
    }

    if (modified === true) {
      text.data = data;
    }
  }
}
