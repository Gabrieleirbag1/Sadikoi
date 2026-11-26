#!/usr/bin/env ruby
# Native iOS settings that Xcode would normally set. Run from the project root:
#   APPLE_TEAM_ID=XXXXXXXXXX ruby scripts/ios-configure.rb
# Safe to run again: files already referenced are left as they are.
require 'xcodeproj'

TEAM_ID = ENV.fetch('APPLE_TEAM_ID')
PROFILE = ENV.fetch('IOS_PROFILE_NAME', 'Sadikoi App Store')

project = Xcodeproj::Project.open('ios/App/App.xcodeproj')
target = project.targets.find { |t| t.name == 'App' }
group = project.main_group['App']

def reference(group, name)
  group.files.find { |f| f.path == name } || group.new_reference(name)
end

# Copied into the app (resources). Add 'GoogleService-Info.plist' here if you use Firebase on iOS.
resources = ['PrivacyInfo.xcprivacy'].map { |name| reference(group, name) }
resources.each do |ref|
  target.add_resources([ref]) unless target.resources_build_phase.files_references.include?(ref)
end

# Read when signing, not copied.
reference(group, 'App.entitlements')

target.build_configurations.each do |config|
  s = config.build_settings
  s['DEVELOPMENT_TEAM'] = TEAM_ID
  s['CODE_SIGN_ENTITLEMENTS'] = 'App/App.entitlements'
  s['TARGETED_DEVICE_FAMILY'] = '1,2' # iPhone + iPad: iPad screenshots are required
  next unless config.name == 'Release'

  s['CODE_SIGN_STYLE'] = 'Manual'
  s['CODE_SIGN_IDENTITY'] = 'Apple Distribution'
  s['CODE_SIGN_IDENTITY[sdk=iphoneos*]'] = 'Apple Distribution'
  s['PROVISIONING_PROFILE_SPECIFIER'] = PROFILE
end

project.save
puts 'ios/App/App.xcodeproj updated'
