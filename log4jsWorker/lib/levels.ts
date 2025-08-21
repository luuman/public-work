import configuration from './configuration';

export type LevelConfigItem = {
  value: number;
  colour: string;
};

export type LevelConfig = Record<string, LevelConfigItem>;

const validColours = ['white', 'grey', 'black', 'blue', 'cyan', 'green', 'magenta', 'red', 'yellow'];

export class Level {
  level: number;
  levelStr: string;
  colour: string;

  static levels: Level[] = [];

  constructor(level: number, levelStr: string, colour: string) {
    this.level = level;
    this.levelStr = levelStr;
    this.colour = colour;
  }

  toString() {
    return this.levelStr;
  }

  static getLevel(sArg?: string | Level | { levelStr: string }, defaultLevel?: Level): Level | undefined {
    if (!sArg) return defaultLevel;

    if (sArg instanceof Level) return sArg;

    if (typeof sArg === 'object' && 'levelStr' in sArg) {
      sArg = sArg.levelStr;
    }

    return (Level as any)[sArg.toString().toUpperCase()] || defaultLevel;
  }

  static addLevels(customLevels?: LevelConfig) {
    if (!customLevels) return;

    Object.keys(customLevels).forEach(l => {
      const levelStr = l.toUpperCase();
      (Level as any)[levelStr] = new Level(customLevels[l].value, levelStr, customLevels[l].colour);

      const existingLevelIndex = Level.levels.findIndex(lvl => lvl.levelStr === levelStr);
      if (existingLevelIndex > -1) {
        Level.levels[existingLevelIndex] = (Level as any)[levelStr];
      } else {
        Level.levels.push((Level as any)[levelStr]);
      }
    });

    Level.levels.sort((a, b) => a.level - b.level);
  }

  isLessThanOrEqualTo(otherLevel: string | Level) {
    if (typeof otherLevel === 'string') {
      otherLevel = Level.getLevel(otherLevel)!;
    }
    return this.level <= otherLevel.level;
  }

  isGreaterThanOrEqualTo(otherLevel: string | Level) {
    if (typeof otherLevel === 'string') {
      otherLevel = Level.getLevel(otherLevel)!;
    }
    return this.level >= otherLevel.level;
  }

  isEqualTo(otherLevel: string | Level) {
    if (typeof otherLevel === 'string') {
      otherLevel = Level.getLevel(otherLevel)!;
    }
    return this.level === otherLevel.level;
  }
}

// 初始化默认等级
Level.addLevels({
  ALL: { value: Number.MIN_VALUE, colour: 'grey' },
  TRACE: { value: 5000, colour: 'blue' },
  DEBUG: { value: 10000, colour: 'cyan' },
  INFO: { value: 20000, colour: 'green' },
  LOG: { value: 20000, colour: 'green' },
  WARN: { value: 30000, colour: 'yellow' },
  ERROR: { value: 40000, colour: 'red' },
  FATAL: { value: 50000, colour: 'magenta' },
  MARK: { value: Number.MAX_SAFE_INTEGER + 1, colour: 'grey' },
  OFF: { value: Number.MAX_VALUE, colour: 'grey' },
});

// 配置监听器，动态添加等级
configuration.addListener(config => {
  const levelConfig: LevelConfig | undefined = config.levels;
  if (!levelConfig) return;

  configuration.throwExceptionIf(config, configuration.not(configuration.anObject(levelConfig)), 'levels must be an object');

  Object.keys(levelConfig).forEach(l => {
    const lvl = levelConfig[l];
    configuration.throwExceptionIf(config, configuration.not(configuration.validIdentifier(l)), `level name "${l}" is not valid`);
    configuration.throwExceptionIf(config, configuration.not(configuration.anObject(lvl)), `level "${l}" must be an object`);
    configuration.throwExceptionIf(config, configuration.not(lvl.value), `level "${l}" must have a 'value' property`);
    configuration.throwExceptionIf(config, configuration.not(configuration.anInteger(lvl.value)), `level "${l}".value must be integer`);
    configuration.throwExceptionIf(config, configuration.not(lvl.colour), `level "${l}" must have a 'colour' property`);
    configuration.throwExceptionIf(config, configuration.not(validColours.includes(lvl.colour)), `level "${l}".colour must be one of ${validColours.join(', ')}`);
  });
});

configuration.addListener(config => {
  Level.addLevels(config.levels);
});

export default Level;
