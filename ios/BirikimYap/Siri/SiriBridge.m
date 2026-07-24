#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SiriBridge, NSObject)

RCT_EXTERN_METHOD(getPendingSiriExpenses:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearPendingSiriExpenses:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
