-- Leave legacy events unset: their original timezone was never recorded.
ALTER TABLE `calendar_events` ADD `time_zone` text;
