// Must be the very first import — amazon-cognito-identity-js needs
// crypto.getRandomValues() for the SRP auth protocol, which Hermes doesn't
// provide out of the box.
import 'react-native-get-random-values';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './package.json';

const componentName = appName === 'insightt-task-list' ? 'InsighttTasks' : appName;

AppRegistry.registerComponent(componentName, () => App);
