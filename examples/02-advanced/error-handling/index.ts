import { Mapper, Map, MapFrom, plainToInstance } from 'om-data-mapper';

class Source {
  validField?: string;
  problematicField?: number;
}

class Target {
  validField?: string;
  problematicField?: string;
}

// `unsafe: true` disables the mapper's internal try/catch so that a
// throwing @MapFrom transformer propagates as a real exception, matching
// this example's try/catch-around-the-mapper pattern.
@Mapper<Source, Target>({ unsafe: true })
class SourceMapper {
  @Map('validField')
  validField!: string;

  @MapFrom((source: Source) => {
    if (typeof source.problematicField !== 'string') {
      throw new Error('problematicField must be a string');
    }

    return source.problematicField;
  })
  problematicField!: string;
}

const source = new Source();
source.validField = 'Some valid data';
source.problematicField = 123; // it`s Number, not String

try {
  const target = plainToInstance<Source, Target>(SourceMapper, source);
  console.log(target);
} catch (error) {
  const e = error as Error;
  console.error('An error occurred during mapping:', e.message);
}
