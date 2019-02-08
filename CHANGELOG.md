# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.5.1"></a>
## [0.5.1](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.5.0...v0.5.1) (2019-02-08)


### Bug Fixes

* drop empty certificates ([a43c3ac](https://github.com/nrkno/tv-automation-mos-gateway/commit/a43c3ac))



<a name="0.5.0"></a>
# [0.5.0](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.4.8...v0.5.0) (2019-02-08)


### Features

* CLI arguments "-certificates" & "-unsafeSSL" ([6f957d0](https://github.com/nrkno/tv-automation-mos-gateway/commit/6f957d0))



<a name="0.4.8"></a>
## [0.4.8](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.4.7...v0.4.8) (2019-01-16)


### Bug Fixes

* update mongodb-memory server to fix build issue ([f2cd240](https://github.com/nrkno/tv-automation-mos-gateway/commit/f2cd240))



<a name="0.4.7"></a>
## [0.4.7](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.4.6...v0.4.7) (2019-01-10)


### Bug Fixes

* **peripheralDevices:** creates more user-friendly names of devices and sub devices. ([f503577](https://github.com/nrkno/tv-automation-mos-gateway/commit/f503577))



<a name="0.4.6"></a>
## [0.4.6](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.4.5...v0.4.6) (2018-12-19)



<a name="0.4.5"></a>
## [0.4.5](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.4.4...v0.4.5) (2018-12-19)



<a name="0.4.4"></a>
## [0.4.4](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.4.3...v0.4.4) (2018-12-13)



<a name="0.4.3"></a>
## [0.4.3](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.4.2...v0.4.3) (2018-11-16)


### Bug Fixes

* bugfixes in mos-connection ([45e79ba](https://github.com/nrkno/tv-automation-mos-gateway/commit/45e79ba))



<a name="0.4.2"></a>
## [0.4.2](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.4.1...v0.4.2) (2018-11-06)


### Bug Fixes

* added places to fix mos data, also for callbacks, not just broadcasts ([b1a6228](https://github.com/nrkno/tv-automation-mos-gateway/commit/b1a6228))



<a name="0.4.1"></a>
## [0.4.1](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.4.0...v0.4.1) (2018-11-06)


### Bug Fixes

* update core-integration dep (clean up old sockets) ([4afd928](https://github.com/nrkno/tv-automation-mos-gateway/commit/4afd928))
* update mos.connection dep ([3462c80](https://github.com/nrkno/tv-automation-mos-gateway/commit/3462c80))



<a name="0.4.0"></a>
# [0.4.0](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.3.4...v0.4.0) (2018-10-11)


### Bug Fixes

* getting debugLogging to work ([d5ab983](https://github.com/nrkno/tv-automation-mos-gateway/commit/d5ab983))
* mos-conn dep (handover bugfix) ([b0da158](https://github.com/nrkno/tv-automation-mos-gateway/commit/b0da158))
* upd mos-conn dep (debug logging) ([6fc5fe9](https://github.com/nrkno/tv-automation-mos-gateway/commit/6fc5fe9))


### Features

* set logLevel & mosConnection.setDebug ([b2fc66c](https://github.com/nrkno/tv-automation-mos-gateway/commit/b2fc66c))
* updated mos-connection dependency, for dynamic setDebug ([096b449](https://github.com/nrkno/tv-automation-mos-gateway/commit/096b449))



<a name="0.3.4"></a>
## [0.3.4](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.3.3...v0.3.4) (2018-09-27)



<a name="0.3.3"></a>
## [0.3.3](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.3.2...v0.3.3) (2018-09-25)



<a name="0.3.2"></a>
## [0.3.2](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.3.1...v0.3.2) (2018-09-04)



<a name="0.3.1"></a>
## [0.3.1](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.3.0...v0.3.1) (2018-08-31)



<a name="0.3.0"></a>
# [0.3.0](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.2.0...v0.3.0) (2018-08-28)


### Features

* addd getSnapshot function stub, used for debugging ([e667135](https://github.com/nrkno/tv-automation-mos-gateway/commit/e667135))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/nrkno/tv-automation-mos-gateway/compare/v0.1.0...v0.2.0) (2018-08-23)


### Bug Fixes

* added -h / -help CLI command ([0466074](https://github.com/nrkno/tv-automation-mos-gateway/commit/0466074))
* added missing core onError handler ([805e305](https://github.com/nrkno/tv-automation-mos-gateway/commit/805e305))
* build-error: WIP: freeze lockfile and see if it builds ([8cb0739](https://github.com/nrkno/tv-automation-mos-gateway/commit/8cb0739))
* build-error: WIP: remove "rm yarn.lock" ([4b7221c](https://github.com/nrkno/tv-automation-mos-gateway/commit/4b7221c))
* build-script: yarn.lock file should not be removed and if updates are needed, that shoud fail the build process. ([d25fd22](https://github.com/nrkno/tv-automation-mos-gateway/commit/d25fd22))
* get device options on init ([320179d](https://github.com/nrkno/tv-automation-mos-gateway/commit/320179d))
* handle mos 'warning' event ([d7ef474](https://github.com/nrkno/tv-automation-mos-gateway/commit/d7ef474))
* handle promises appropriately ([31385e8](https://github.com/nrkno/tv-automation-mos-gateway/commit/31385e8))
* **mosHandler:** do not reject in initialization before connection ([9997306](https://github.com/nrkno/tv-automation-mos-gateway/commit/9997306))
* init action ordering (_updateDevices could be called before _initMosConnection was done) ([c622c68](https://github.com/nrkno/tv-automation-mos-gateway/commit/c622c68))
* removed package-lock.json, in favor for yarn.lock ([b31a9a4](https://github.com/nrkno/tv-automation-mos-gateway/commit/b31a9a4))
* uncaught error thrown when logging circular dependencies ([a3b2f9f](https://github.com/nrkno/tv-automation-mos-gateway/commit/a3b2f9f))
* updated core dependency & added fix for when shutting down / disposing (causing error) ([20ff505](https://github.com/nrkno/tv-automation-mos-gateway/commit/20ff505))
* use offspec failover for security ([35b9108](https://github.com/nrkno/tv-automation-mos-gateway/commit/35b9108))


### Features

* added version reporting upon init ([d71a594](https://github.com/nrkno/tv-automation-mos-gateway/commit/d71a594))
* updated dependencies (containing the xml rehaul) ([6efcb96](https://github.com/nrkno/tv-automation-mos-gateway/commit/6efcb96))



<a name="0.1.0"></a>
# 0.1.0 (2018-08-02)


### Bug Fixes

* bugfix ([6bf2762](https://github.com/nrkno/tv-automation-mos-gateway/commit/6bf2762))
* changed "test" to "spec" files ([f048398](https://github.com/nrkno/tv-automation-mos-gateway/commit/f048398))
* correct license holder ([9042cc0](https://github.com/nrkno/tv-automation-mos-gateway/commit/9042cc0))


### Features

* added -disableWatchdog cli option ([8b7bdf9](https://github.com/nrkno/tv-automation-mos-gateway/commit/8b7bdf9))
* added debugLogging ([b390c67](https://github.com/nrkno/tv-automation-mos-gateway/commit/b390c67))
* added integration stub for profile 0 ([df8af47](https://github.com/nrkno/tv-automation-mos-gateway/commit/df8af47))
* added methods for piping mos data into Core ([3cbb459](https://github.com/nrkno/tv-automation-mos-gateway/commit/3cbb459))
* added watchDog ([476ba47](https://github.com/nrkno/tv-automation-mos-gateway/commit/476ba47))
* Core ddp-connector and init strategy ([93f2f60](https://github.com/nrkno/tv-automation-mos-gateway/commit/93f2f60))
* implemented Mos-connection (it works now) ([27bf4c0](https://github.com/nrkno/tv-automation-mos-gateway/commit/27bf4c0))
* kill process when init fails ([fe05191](https://github.com/nrkno/tv-automation-mos-gateway/commit/fe05191))
* updated core-integration dep, introducing autoSubscribe ([6cc8604](https://github.com/nrkno/tv-automation-mos-gateway/commit/6cc8604))
* updated dependency of core-integration ([676761e](https://github.com/nrkno/tv-automation-mos-gateway/commit/676761e))
