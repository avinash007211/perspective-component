import {ComponentMeta, ComponentRegistry} from '@inductiveautomation/perspective-client';
import { Image, ImageMeta } from './components/Image';
import { ImageTest, ImageTestMeta } from './components/ImageTest';
import { MessengerComponent, MessengerComponentMeta } from './components/Messenger';
import { TagCounter, TagCounterMeta } from './components/TagCounter';
import { CsvToAlarmLog, CsvToAlarmLogMeta } from './components/CsvToAlarmLog';
import { ScreenCapture, ScreenCaptureMeta} from './components/Screencapture';


// export so the components are referencable, e.g. `RadComponents['Image']
export {Image, ImageTest, MessengerComponent, TagCounter, CsvToAlarmLog, ScreenCapture};

import '../scss/main';

// as new components are implemented, import them, and add their meta to this array
const components: Array<ComponentMeta> = [
    new ImageTestMeta(),
    new ImageMeta(),
    new MessengerComponentMeta(),
    new TagCounterMeta(),
    new CsvToAlarmLogMeta(),
    new ScreenCaptureMeta()
];

// iterate through our components, registering each one with the registry.  Don't forget to register on the Java side too!
components.forEach((c: ComponentMeta) => ComponentRegistry.register(c) );
