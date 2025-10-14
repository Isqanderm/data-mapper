import { Mapper } from '../../src';

class Source {
  validField?: string;
  problematicField?: number;
}

class Target {
  validField?: string;
  problematicField?: string;
}

const mapper = Mapper.create<Source, Target>({
  validField: 'validField',
  problematicField: (source) => {
    if (typeof source.problematicField !== 'string') {
      throw new Error('problematicField must be a string');
    }

    return source.problematicField;
  },
});

const source = new Source();
source.validField = 'Some valid data';
source.problematicField = 123; // it`s Number, not String

try {
  const target = mapper.execute(source);
  console.log(target);
} catch (error) {
  const e = error as Error;
  console.error('An error occurred during mapping:', e.message);
}
