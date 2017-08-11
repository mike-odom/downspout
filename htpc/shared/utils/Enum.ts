class Enum {
    private _name;

    protected constructor(name) {
        this._name = name;
    }

    public name(): string {
        return this._name;
    }

    toString() {
        return this.constructor.name + '.' + this.name;
    }
}

export {Enum}