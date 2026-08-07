#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WatchSyncModule, NSObject)
RCT_EXTERN_METHOD(updateWatchContext:(NSDictionary *)data)
@end
