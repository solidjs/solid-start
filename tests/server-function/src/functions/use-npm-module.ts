"use server";

import _ from 'lodash';

export function serverFnWithNpmModule() {

  return _.map([1, 2, 3], x => x * 2);
}
