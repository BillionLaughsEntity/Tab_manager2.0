// js/services/sampleData.js

/**
 * Generates sample data matching your VK, Projects, Solutions structure
 */

class SampleDataGenerator {
    static generate() {
        Logger.info('SampleData', 'Generating sample data based on user structure');
        
        // Create links for Vk_playlists_ARC
        const vkPlaylistLinks = [
            new Link(null, 'Купинов_ARC', 'https://vkvideo.ru/playlist/-56169357_1009'),
            new Link(null, 'Subnautica_Arc', 'https://vkvideo.ru/playlist/-56169357_1008'),
            new Link(null, 'MAFIA_ARC', 'https://vkvideo.ru/playlist/-56169357_1007')
        ];
        
        // Create tabs for VK environment
        const vkTabs = [
            new Tab(null, 'Vk_playlists'),
            new Tab(null, 'Vk_playlists_ARC', vkPlaylistLinks),
            new Tab(null, 'Subscriptions'),
            new Tab(null, 'VK_longplays')
        ];
        
        // Create tabs for Projects environment
        const projectTabs = [
            new Tab(null, 'DREDGE Прохождение', [new Link(null, 'DREDGE Playlist', 'https://vkvideo.ru/playlist/-56169357_1009')]),
            new Tab(null, "No, I'm not a Human", [new Link(null, 'Game Playlist', 'https://vkvideo.ru/playlist/-56169357_1009')]),
            new Tab(null, 'Hell is Us', [new Link(null, 'Hell is Us Playlist', 'https://vkvideo.ru/playlist/-56169357_1008')]),
            new Tab(null, 'КУПЛИНОВ УЧИТСЯ РИСОВАТЬ', [new Link(null, 'Drawing Series', 'https://vkvideo.ru/playlist/-56169357_4043')]),
            new Tab(null, "Thank Goodness You're Here!", [new Link(null, 'Game Walkthrough', 'https://vkvideo.ru/playlist/-56169357_1027')]),
            new Tab(null, 'Rock of Ages Прохождение', [new Link(null, 'Rock of Ages Playlist', 'https://vkvideo.ru/playlist/-56169357_3402')])
        ];
        
        // Create tabs for Solutions environment
        const solutionTabs = [
            new Tab(null, 'Select Links'),
            new Tab(null, 'Add Multi-Link Card'),
            new Tab(null, 'Create Search Link'),
            new Tab(null, 'Create Outlook Email'),
            new Tab(null, 'Add Link')
        ];
        
        // Create environments
        const environments = [
            new Environment(null, 'VK', vkTabs),
            new Environment(null, 'Projects', projectTabs),
            new Environment(null, 'Solutions', solutionTabs)
        ];
        
        // Create profile
        const defaultProfile = new Profile(null, 'Default', environments);
        
        // Create workbooks
        const workbooks = [
            new Workbook(null, 'Main', [defaultProfile]),
            new Workbook(null, 'Personal'),
            new Workbook(null, 'Work')
        ];
        
        Logger.debug('SampleData', 'Sample data generated', {
            workbooks: workbooks.length,
            profiles: workbooks.reduce((sum, w) => sum + w.profiles.length, 0),
            environments: workbooks.reduce((sum, w) => sum + w.getTotalEnvironmentCount(), 0),
            tabs: workbooks.reduce((sum, w) => sum + w.getTotalTabCount(), 0),
            links: workbooks.reduce((sum, w) => sum + w.getTotalLinkCount(), 0)
        });
        
        return workbooks;
    }
}

window.SampleDataGenerator = SampleDataGenerator;