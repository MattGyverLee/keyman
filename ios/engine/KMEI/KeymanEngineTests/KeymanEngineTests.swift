//
//  KeymanEngineTests.swift
//  KeymanEngineTests
//
//  Created by Randy Boring on 3/7/19.
//  Copyright © 2019 SIL International. All rights reserved.
//

import XCTest

@testable import KeymanEngine
import DeviceKit


class KeymanEngineTests: XCTestCase {
  public static let TEST_BUNDLE_IDENTIFIER = "com.keyman.testing.KeymanEngineTests"
  
  override func setUp() {
    // Put setup code here. This method is called before the invocation of each test method in the class.
  }
  
  override func tearDown() {
    // Put teardown code here. This method is called after the invocation of each test method in the class.
  }

  func getAssignedDictionary(for userDefaults: UserDefaults) -> [String: Any] {
    var currentDictionary = userDefaults.dictionaryRepresentation()
    clearSettings(of: userDefaults)
    let baseDict = userDefaults.dictionaryRepresentation()

    baseDict.forEach({ pair in
      currentDictionary.removeValue(forKey: pair.key)
    })

    // The return value is now properly constructed.  Now to put the defaults back in place before we leave.
    //userDefaults.register(defaults: currentDictionary) // adds them in an unclearable way!
    currentDictionary.forEach({ pair in
      userDefaults.set(pair.value, forKey: pair.key)
    })
    return currentDictionary
  }

  func clearSettings(of userDefaults: UserDefaults) {
    let domain = Bundle.main.bundleIdentifier!
    userDefaults.synchronize()
    userDefaults.removePersistentDomain(forName: domain)
  }

  func testStorageAccess() {
    // Xcode unit tests cannot use capabilities, and thus we cannot access a true app group.
    // So, we'll use a sandboxed analogue for this instead.

    // Critical core aspect - access to the following property should return something sandboxed but usable.
    let storage = Storage.active!
    log.info(storage.baseDir)

    // Diff-magic for determining the dictionary to be utilized for a test.
    let userDefaults = storage.userDefaults
    userDefaults.set(4, forKey: "testEntry")
    let dictCheck = getAssignedDictionary(for: userDefaults)

    Storage.active.erase()
  }

  // AMDD acceptance test for existing KeymanPackage so I'll know what has to keep working despite my changers
  func testExample() {
    let testUrl = URL(fileURLWithPath: "/Users/Shared/testpackage.kmp");
    let outUrl  = URL(fileURLWithPath: "/Users/Shared/outPackageFolder")

    // Note:  does not detect failure to extract!  This is basically leftover material from a previous dev's
    //        original attempt to add unit testing.
    //
    //        Honestly, that's the only reason this passes.  This test isn't actually functional yet.
    KeymanPackage.extract(fileUrl: testUrl, destination: outUrl, complete: { kmp in
      if let kmp = kmp {
        // extracted ok, test kmp
        XCTAssert(kmp.sourceFolder == outUrl, "the sourceFolder should be outURL")
      } else {
        XCTAssert(false, "KeymanPackage.extract failed")
      }
    })        // Use XCTAssert and related functions to verify your tests produce the correct results.
  }
  
  func testPerformanceExample() {
    // This is an example of a performance test case.
    self.measure {
      // Put the code you want to measure the time of here.
    }
  }
  
}
