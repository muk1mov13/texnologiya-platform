// Bu fayl avtomatik generatsiya qilinadi — qo'lda tahrirlamang.
// Yangilash: `npm run gen:api` (backend OpenAPI sxemasidan).
export interface paths {
    "/api/activities/{activity_id}/attempts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Submit Attempt */
        post: operations["submit_attempt_api_activities__activity_id__attempts_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/subjects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Subjects */
        get: operations["list_subjects_api_admin_subjects_get"];
        put?: never;
        /** Create Subject */
        post: operations["create_subject_api_admin_subjects_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/subjects/{subject_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Subject */
        delete: operations["delete_subject_api_admin_subjects__subject_id__delete"];
        options?: never;
        head?: never;
        /** Update Subject */
        patch: operations["update_subject_api_admin_subjects__subject_id__patch"];
        trace?: never;
    };
    "/api/admin/subjects/{subject_id}/teachers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Set Teachers */
        put: operations["set_teachers_api_admin_subjects__subject_id__teachers_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Users */
        get: operations["list_users_api_admin_users_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/users/{user_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update User */
        patch: operations["update_user_api_admin_users__user_id__patch"];
        trace?: never;
    };
    "/api/admin/users/{user_id}/temp-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Set Temp Password */
        post: operations["set_temp_password_api_admin_users__user_id__temp_password_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Login */
        post: operations["login_api_auth_login_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Logout */
        post: operations["logout_api_auth_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Refresh */
        post: operations["refresh_api_auth_refresh_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Register */
        post: operations["register_api_auth_register_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Health */
        get: operations["health_api_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/materials/{material_id}/file": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Material File */
        get: operations["material_file_api_materials__material_id__file_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Me */
        get: operations["me_api_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Me */
        patch: operations["update_me_api_me_patch"];
        trace?: never;
    };
    "/api/me/attempts/{attempt_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Attempt Detail */
        get: operations["attempt_detail_api_me_attempts__attempt_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/me/continue": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Continue Learning */
        get: operations["continue_learning_api_me_continue_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/me/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Dashboard */
        get: operations["dashboard_api_me_dashboard_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/me/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Change Password */
        post: operations["change_password_api_me_password_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/me/progress": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My Progress */
        get: operations["my_progress_api_me_progress_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/me/results": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My Results */
        get: operations["my_results_api_me_results_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/steps/{step_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Step */
        get: operations["get_step_api_steps__step_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/steps/{step_id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Complete Step */
        post: operations["complete_step_api_steps__step_id__complete_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/subjects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Subjects */
        get: operations["list_subjects_api_subjects_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/subjects/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Subject */
        get: operations["get_subject_api_subjects__slug__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/submissions/{submission_id}/file": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Submission File */
        get: operations["submission_file_api_submissions__submission_id__file_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/tasks/{task_id}/submission": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Submit Task */
        put: operations["submit_task_api_tasks__task_id__submission_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/activities/{activity_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update Activity */
        put: operations["update_activity_api_teach_activities__activity_id__put"];
        post?: never;
        /** Delete Activity */
        delete: operations["delete_activity_api_teach_activities__activity_id__delete"];
        options?: never;
        head?: never;
        /** Publish Activity */
        patch: operations["publish_activity_api_teach_activities__activity_id__patch"];
        trace?: never;
    };
    "/api/teach/materials/{material_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Material */
        delete: operations["delete_material_api_teach_materials__material_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/materials/{material_id}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Retry Material */
        post: operations["retry_material_api_teach_materials__material_id__retry_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Teach Stats */
        get: operations["teach_stats_api_teach_stats_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/steps/{step_id}/activities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Activities */
        get: operations["list_activities_api_teach_steps__step_id__activities_get"];
        put?: never;
        /** Create Activity */
        post: operations["create_activity_api_teach_steps__step_id__activities_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/steps/{step_id}/activities/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Reorder Activities */
        put: operations["reorder_activities_api_teach_steps__step_id__activities_order_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/steps/{step_id}/materials": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Upload Material */
        post: operations["upload_material_api_teach_steps__step_id__materials_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/steps/{step_id}/task": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Task */
        get: operations["get_task_api_teach_steps__step_id__task_get"];
        /** Upsert Task */
        put: operations["upsert_task_api_teach_steps__step_id__task_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/subjects": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My Subjects */
        get: operations["my_subjects_api_teach_subjects_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/subjects/{subject_id}/topics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Topic */
        post: operations["create_topic_api_teach_subjects__subject_id__topics_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/subjects/{subject_id}/topics/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Reorder Topics */
        put: operations["reorder_topics_api_teach_subjects__subject_id__topics_order_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/submissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Submissions */
        get: operations["list_submissions_api_teach_submissions_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/submissions/{submission_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Submission */
        get: operations["get_submission_api_teach_submissions__submission_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/submissions/{submission_id}/file": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Submission File */
        get: operations["submission_file_api_teach_submissions__submission_id__file_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/submissions/{submission_id}/grade": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Grade Submission */
        post: operations["grade_submission_api_teach_submissions__submission_id__grade_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/submissions/{submission_id}/return": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Return Submission */
        post: operations["return_submission_api_teach_submissions__submission_id__return_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Teach Summary */
        get: operations["teach_summary_api_teach_summary_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/tasks/{task_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Task */
        delete: operations["delete_task_api_teach_tasks__task_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/topics/{topic_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Topic */
        get: operations["get_topic_api_teach_topics__topic_id__get"];
        put?: never;
        post?: never;
        /** Delete Topic */
        delete: operations["delete_topic_api_teach_topics__topic_id__delete"];
        options?: never;
        head?: never;
        /** Update Topic */
        patch: operations["update_topic_api_teach_topics__topic_id__patch"];
        trace?: never;
    };
    "/api/teach/topics/{topic_id}/glossary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Glossary */
        get: operations["list_glossary_api_teach_topics__topic_id__glossary_get"];
        put?: never;
        /** Add Glossary Term */
        post: operations["add_glossary_term_api_teach_topics__topic_id__glossary_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/topics/{topic_id}/glossary/{term_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Glossary Term */
        delete: operations["delete_glossary_term_api_teach_topics__topic_id__glossary__term_id__delete"];
        options?: never;
        head?: never;
        /** Update Glossary Term */
        patch: operations["update_glossary_term_api_teach_topics__topic_id__glossary__term_id__patch"];
        trace?: never;
    };
    "/api/teach/topics/{topic_id}/literature": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Literature */
        get: operations["list_literature_api_teach_topics__topic_id__literature_get"];
        put?: never;
        /** Add Literature */
        post: operations["add_literature_api_teach_topics__topic_id__literature_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/topics/{topic_id}/literature/{item_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Literature */
        delete: operations["delete_literature_api_teach_topics__topic_id__literature__item_id__delete"];
        options?: never;
        head?: never;
        /** Update Literature */
        patch: operations["update_literature_api_teach_topics__topic_id__literature__item_id__patch"];
        trace?: never;
    };
    "/api/topics/{topic_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Topic */
        get: operations["get_topic_api_topics__topic_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** ActivityOrderIn */
        ActivityOrderIn: {
            /** Ids */
            ids: number[];
        };
        /** ActivityPublishIn */
        ActivityPublishIn: {
            /** Is Published */
            is_published: boolean;
        };
        /** ActivityResultOut */
        ActivityResultOut: {
            /** Activity Id */
            activity_id: number;
            /** Attempts Count */
            attempts_count: number;
            /** Best Percent */
            best_percent: number;
            /**
             * Last Attempt At
             * Format: date-time
             */
            last_attempt_at: string;
            /** Last Attempt Id */
            last_attempt_id: number;
            /** Title */
            title: string;
            type: components["schemas"]["ActivityType"];
        };
        /** ActivityTeachOut */
        ActivityTeachOut: {
            /** Id */
            id: number;
            /** Is Published */
            is_published: boolean;
            /** Items */
            items: (components["schemas"]["QuizItemOut"] | components["schemas"]["YesNoItemOut"] | components["schemas"]["CrosswordItemOut"])[];
            layout: components["schemas"]["TeachLayout"] | null;
            /** Order */
            order: number;
            /** Step Id */
            step_id: number;
            /** Title */
            title: string;
            type: components["schemas"]["ActivityType"];
        };
        /**
         * ActivityType
         * @enum {string}
         */
        ActivityType: "quiz" | "yesno" | "crossword";
        /** ActivityView */
        ActivityView: {
            /** Attempts Count */
            attempts_count: number;
            /** Best Percent */
            best_percent: number | null;
            /** Id */
            id: number;
            /** Items */
            items: (components["schemas"]["QuizItemView"] | components["schemas"]["YesNoItemView"])[];
            layout: components["schemas"]["StudentLayout"] | null;
            /** Title */
            title: string;
            type: components["schemas"]["ActivityType"];
        };
        /** AdminUserUpdateIn */
        AdminUserUpdateIn: {
            role?: components["schemas"]["Role"] | null;
            status?: components["schemas"]["UserStatus"] | null;
        };
        /** AttemptDetailOut */
        AttemptDetailOut: {
            /** Activity Id */
            activity_id: number;
            /** Activity Title */
            activity_title: string;
            activity_type: components["schemas"]["ActivityType"];
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Id */
            id: number;
            /** Max Score */
            max_score: number;
            /** Result */
            result: components["schemas"]["ResultItem"][];
            /** Score */
            score: number;
        };
        /**
         * AttemptIn
         * @description Javoblar talabaga yuborilgan elementlar tartibida: test — 0..3, ha/yo'q — bool,
         *     krossvord — so'z satri; javobsiz element — null.
         */
        AttemptIn: {
            /** Answers */
            answers: (number | boolean | string | null)[];
        };
        /** AttemptOut */
        AttemptOut: {
            /** Activity Id */
            activity_id: number;
            /** Attempt Id */
            attempt_id: number;
            /** Max Score */
            max_score: number;
            /** Result */
            result: components["schemas"]["ResultItem"][];
            rewards: components["schemas"]["RewardsOut"];
            /** Score */
            score: number;
            step: components["schemas"]["StepBrief"];
        };
        /** BadgeBrief */
        BadgeBrief: {
            /** Code */
            code: string;
            /** Icon */
            icon: string;
            /** Title Ru */
            title_ru: string;
            /** Title Uz */
            title_uz: string;
        };
        /** BadgeOut */
        BadgeOut: {
            /** Awarded At */
            awarded_at: string | null;
            /** Code */
            code: string;
            /** Description Ru */
            description_ru: string;
            /** Description Uz */
            description_uz: string;
            /** Icon */
            icon: string;
            /** Title Ru */
            title_ru: string;
            /** Title Uz */
            title_uz: string;
        };
        /** Body_submit_task_api_tasks__task_id__submission_put */
        Body_submit_task_api_tasks__task_id__submission_put: {
            /** File */
            file?: string | null;
            /** Text */
            text?: string | null;
        };
        /** Body_upload_material_api_teach_steps__step_id__materials_post */
        Body_upload_material_api_teach_steps__step_id__materials_post: {
            /** File */
            file: string;
            /** Title */
            title: string;
        };
        /** ContinueOut */
        ContinueOut: {
            /** Step Id */
            step_id: number;
            step_kind: components["schemas"]["StepKind"];
            /** Subject Id */
            subject_id: number;
            /** Subject Slug */
            subject_slug: string;
            /** Subject Title */
            subject_title: string;
            /** Topic Id */
            topic_id: number;
            /** Topic Title */
            topic_title: string;
        };
        /** CrosswordActivityIn */
        CrosswordActivityIn: {
            /** Items */
            items: components["schemas"]["CrosswordItemIn"][];
            /** Title */
            title: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "crossword";
        };
        /** CrosswordItemIn */
        CrosswordItemIn: {
            /** Clue */
            clue: string;
            /** Word */
            word: string;
        };
        /** CrosswordItemOut */
        CrosswordItemOut: {
            /** Clue */
            clue: string;
            /** Id */
            id: number;
            /** Word */
            word: string;
        };
        /** DashboardOut */
        DashboardOut: {
            /** Badges */
            badges: components["schemas"]["BadgeOut"][];
            continue_step: components["schemas"]["ContinueOut"] | null;
            streak: components["schemas"]["StreakOut"];
            /** Xp Total */
            xp_total: number;
        };
        /** GlossaryIn */
        GlossaryIn: {
            /** Definition */
            definition: string;
            /** Term */
            term: string;
        };
        /** GlossaryOut */
        GlossaryOut: {
            /** Definition */
            definition: string;
            /** Id */
            id: number;
            /** Order */
            order: number;
            /** Term */
            term: string;
        };
        /** GlossaryUpdate */
        GlossaryUpdate: {
            /** Definition */
            definition?: string | null;
            /** Term */
            term?: string | null;
        };
        /** GradeIn */
        GradeIn: {
            /** Feedback */
            feedback?: string | null;
            /** Score */
            score: number;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** LiteratureIn */
        LiteratureIn: {
            /**
             * Author
             * @default
             */
            author?: string;
            /** Title */
            title: string;
            /** Url */
            url?: string | null;
            /** Year */
            year?: number | null;
        };
        /** LiteratureOut */
        LiteratureOut: {
            /** Author */
            author: string;
            /** Id */
            id: number;
            /** Order */
            order: number;
            /** Title */
            title: string;
            /** Url */
            url: string | null;
            /** Year */
            year: number | null;
        };
        /** LiteratureUpdate */
        LiteratureUpdate: {
            /** Author */
            author?: string | null;
            /** Title */
            title?: string | null;
            /** Url */
            url?: string | null;
            /** Year */
            year?: number | null;
        };
        /**
         * Locale
         * @enum {string}
         */
        Locale: "uz" | "ru";
        /** LoginIn */
        LoginIn: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Password */
            password: string;
        };
        /** MaterialOut */
        MaterialOut: {
            /** Error */
            error: string | null;
            /** Id */
            id: number;
            /** Original Name */
            original_name: string;
            /** Page Count */
            page_count: number | null;
            status: components["schemas"]["MaterialStatus"];
            /** Step Id */
            step_id: number;
            /** Title */
            title: string;
        };
        /**
         * MaterialStatus
         * @enum {string}
         */
        MaterialStatus: "processing" | "ready" | "failed";
        /** MaterialView */
        MaterialView: {
            /** File Url */
            file_url: string;
            /** Id */
            id: number;
            /** Page Count */
            page_count: number | null;
            /** Title */
            title: string;
        };
        /** MeUpdateIn */
        MeUpdateIn: {
            /** Full Name */
            full_name?: string | null;
            locale?: components["schemas"]["Locale"] | null;
            /** Phone */
            phone?: string | null;
        };
        /** PasswordChangeIn */
        PasswordChangeIn: {
            /** Current Password */
            current_password: string;
            /** New Password */
            new_password: string;
        };
        /** ProgressOut */
        ProgressOut: {
            /** Completed */
            completed: number;
            /** Total */
            total: number;
        };
        /**
         * ProgressStatus
         * @enum {string}
         */
        ProgressStatus: "in_progress" | "completed";
        /** QuizActivityIn */
        QuizActivityIn: {
            /** Items */
            items: components["schemas"]["QuizItemIn"][];
            /** Title */
            title: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "quiz";
        };
        /** QuizItemIn */
        QuizItemIn: {
            /** Correct Index */
            correct_index: number;
            /** Explanation */
            explanation?: string | null;
            /** Options */
            options: string[];
            /** Text */
            text: string;
        };
        /** QuizItemOut */
        QuizItemOut: {
            /** Correct Index */
            correct_index: number;
            /** Explanation */
            explanation: string | null;
            /** Id */
            id: number;
            /** Options */
            options: string[];
            /** Text */
            text: string;
        };
        /** QuizItemView */
        QuizItemView: {
            /** Options */
            options: string[];
            /** Text */
            text: string;
        };
        /** RegisterIn */
        RegisterIn: {
            /**
             * Email
             * Format: email
             */
            email: string;
            /** Full Name */
            full_name: string;
            /** @default uz */
            locale?: components["schemas"]["Locale"];
            /** Password */
            password: string;
            /** Phone */
            phone?: string | null;
        };
        /** ResultItem */
        ResultItem: {
            /** Correct */
            correct: number | boolean | string;
            /** Explanation */
            explanation?: string | null;
            /** Given */
            given: number | boolean | string | null;
            /** Is Correct */
            is_correct: boolean;
            /** Options */
            options?: string[] | null;
            /** Prompt */
            prompt: string;
        };
        /** ReturnIn */
        ReturnIn: {
            /** Feedback */
            feedback: string;
        };
        /** RewardsOut */
        RewardsOut: {
            /**
             * New Badges
             * @default []
             */
            new_badges?: components["schemas"]["BadgeBrief"][];
            /**
             * Xp
             * @default 0
             */
            xp?: number;
        };
        /**
         * Role
         * @enum {string}
         */
        Role: "student" | "teacher" | "admin";
        /** StepBrief */
        StepBrief: {
            /** Has Content */
            has_content: boolean;
            /** Id */
            id: number;
            kind: components["schemas"]["StepKind"];
            /** Order */
            order: number;
            status: components["schemas"]["ProgressStatus"] | null;
        };
        /** StepCompleteOut */
        StepCompleteOut: {
            /** Has Content */
            has_content: boolean;
            /** Id */
            id: number;
            kind: components["schemas"]["StepKind"];
            /** Order */
            order: number;
            rewards: components["schemas"]["RewardsOut"];
            status: components["schemas"]["ProgressStatus"] | null;
        };
        /** StepContentOut */
        StepContentOut: {
            /**
             * Activities
             * @default []
             */
            activities?: components["schemas"]["ActivityView"][];
            /** Glossary */
            glossary: components["schemas"]["GlossaryOut"][];
            /** Has Content */
            has_content: boolean;
            /** Id */
            id: number;
            kind: components["schemas"]["StepKind"];
            /** Literature */
            literature: components["schemas"]["LiteratureOut"][];
            /** Materials */
            materials: components["schemas"]["MaterialView"][];
            /** Order */
            order: number;
            status: components["schemas"]["ProgressStatus"] | null;
            submission?: components["schemas"]["SubmissionView"] | null;
            task?: components["schemas"]["TaskView"] | null;
            /** Topic Id */
            topic_id: number;
        };
        /** StepEditorOut */
        StepEditorOut: {
            /** Id */
            id: number;
            kind: components["schemas"]["StepKind"];
            /** Materials */
            materials: components["schemas"]["MaterialOut"][];
            /** Order */
            order: number;
        };
        /**
         * StepKind
         * @enum {string}
         */
        StepKind: "review" | "lecture" | "presentation" | "practice" | "task" | "glossary" | "literature";
        /** StreakOut */
        StreakOut: {
            /** Active Today */
            active_today: boolean;
            /** Current */
            current: number;
            /** Longest */
            longest: number;
        };
        /** StudentLayout */
        StudentLayout: {
            /** Cols */
            cols: number;
            /** Rows */
            rows: number;
            /** Words */
            words: components["schemas"]["StudentLayoutWord"][];
        };
        /** StudentLayoutWord */
        StudentLayoutWord: {
            /** Clue */
            clue: string;
            /** Col */
            col: number;
            /**
             * Direction
             * @enum {string}
             */
            direction: "across" | "down";
            /** Length */
            length: number;
            /** Number */
            number: number;
            /** Row */
            row: number;
        };
        /** SubjectAdminOut */
        SubjectAdminOut: {
            /** Cover */
            cover: string | null;
            /** Description */
            description: string;
            /** Id */
            id: number;
            /** Is Published */
            is_published: boolean;
            /** Order */
            order: number;
            /** Slug */
            slug: string;
            /**
             * Teacher Ids
             * @default []
             */
            teacher_ids?: number[];
            /** Title */
            title: string;
        };
        /** SubjectCard */
        SubjectCard: {
            /** Cover */
            cover: string | null;
            /** Description */
            description: string;
            /** Id */
            id: number;
            progress: components["schemas"]["ProgressOut"];
            /** Slug */
            slug: string;
            /** Title */
            title: string;
            /** Topic Count */
            topic_count: number;
        };
        /** SubjectCreate */
        SubjectCreate: {
            /**
             * Description
             * @default
             */
            description?: string;
            /**
             * Is Published
             * @default false
             */
            is_published?: boolean;
            /**
             * Order
             * @default 0
             */
            order?: number;
            /** Slug */
            slug?: string | null;
            /** Title */
            title: string;
        };
        /** SubjectDetailOut */
        SubjectDetailOut: {
            /** Cover */
            cover: string | null;
            /** Description */
            description: string;
            /** Id */
            id: number;
            /** Slug */
            slug: string;
            /** Title */
            title: string;
            /** Topics */
            topics: components["schemas"]["TopicCard"][];
        };
        /** SubjectProgressOut */
        SubjectProgressOut: {
            progress: components["schemas"]["ProgressOut"];
            /** Subject Id */
            subject_id: number;
            /** Subject Slug */
            subject_slug: string;
            /** Subject Title */
            subject_title: string;
        };
        /** SubjectRef */
        SubjectRef: {
            /** Id */
            id: number;
            /** Slug */
            slug: string;
            /** Title */
            title: string;
        };
        /** SubjectResultsOut */
        SubjectResultsOut: {
            /** Subject Id */
            subject_id: number;
            /** Subject Slug */
            subject_slug: string;
            /** Subject Title */
            subject_title: string;
            /** Topics */
            topics: components["schemas"]["TopicResultsOut"][];
        };
        /** SubjectUpdate */
        SubjectUpdate: {
            /** Description */
            description?: string | null;
            /** Is Published */
            is_published?: boolean | null;
            /** Order */
            order?: number | null;
            /** Slug */
            slug?: string | null;
            /** Title */
            title?: string | null;
        };
        /** SubmissionDetailOut */
        SubmissionDetailOut: {
            /** Feedback */
            feedback: string | null;
            /** File Url */
            file_url: string | null;
            /** Graded At */
            graded_at: string | null;
            /** Id */
            id: number;
            /** Is Late */
            is_late: boolean;
            /** Max Score */
            max_score: number;
            /** Original Name */
            original_name: string | null;
            /** Rubric */
            rubric: string | null;
            /** Score */
            score: number | null;
            status: components["schemas"]["SubmissionStatus"];
            /** Student Name */
            student_name: string;
            /** Subject Id */
            subject_id: number;
            /** Subject Title */
            subject_title: string;
            /**
             * Submitted At
             * Format: date-time
             */
            submitted_at: string;
            /** Task Description */
            task_description: string;
            /** Task Id */
            task_id: number;
            /** Task Title */
            task_title: string;
            /** Text */
            text: string | null;
            /** Topic Id */
            topic_id: number;
            /** Topic Title */
            topic_title: string;
        };
        /** SubmissionQueueItem */
        SubmissionQueueItem: {
            /** Id */
            id: number;
            /** Is Late */
            is_late: boolean;
            status: components["schemas"]["SubmissionStatus"];
            /** Student Name */
            student_name: string;
            /** Subject Id */
            subject_id: number;
            /** Subject Title */
            subject_title: string;
            /**
             * Submitted At
             * Format: date-time
             */
            submitted_at: string;
            /** Task Id */
            task_id: number;
            /** Task Title */
            task_title: string;
            /** Topic Id */
            topic_id: number;
            /** Topic Title */
            topic_title: string;
        };
        /**
         * SubmissionStatus
         * @enum {string}
         */
        SubmissionStatus: "submitted" | "graded" | "returned";
        /** SubmissionView */
        SubmissionView: {
            /** Feedback */
            feedback: string | null;
            /** File Url */
            file_url: string | null;
            /** Graded At */
            graded_at: string | null;
            /** Id */
            id: number;
            /** Is Late */
            is_late: boolean;
            /** Original Name */
            original_name: string | null;
            /** Score */
            score: number | null;
            status: components["schemas"]["SubmissionStatus"];
            /**
             * Submitted At
             * Format: date-time
             */
            submitted_at: string;
            /** Text */
            text: string | null;
        };
        /** SubmitOut */
        SubmitOut: {
            rewards: components["schemas"]["RewardsOut"];
            step: components["schemas"]["StepBrief"];
            submission: components["schemas"]["SubmissionView"];
        };
        /** TaskIn */
        TaskIn: {
            /** Deadline */
            deadline?: string | null;
            /** Description */
            description: string;
            /** Max Score */
            max_score: number;
            /** Rubric */
            rubric?: string | null;
            /** Title */
            title: string;
            type: components["schemas"]["TaskType"];
        };
        /** TaskOut */
        TaskOut: {
            /** Deadline */
            deadline: string | null;
            /** Description */
            description: string;
            /** Id */
            id: number;
            /** Max Score */
            max_score: number;
            /** Rubric */
            rubric: string | null;
            /** Step Id */
            step_id: number;
            /** Title */
            title: string;
            type: components["schemas"]["TaskType"];
        };
        /** TaskResultOut */
        TaskResultOut: {
            /** Feedback */
            feedback: string | null;
            /** Is Late */
            is_late: boolean;
            /** Max Score */
            max_score: number;
            /** Score */
            score: number | null;
            status: components["schemas"]["SubmissionStatus"];
            /**
             * Submitted At
             * Format: date-time
             */
            submitted_at: string;
            /** Task Id */
            task_id: number;
            /** Title */
            title: string;
        };
        /**
         * TaskType
         * @enum {string}
         */
        TaskType: "text" | "file" | "both";
        /** TaskView */
        TaskView: {
            /** Deadline */
            deadline: string | null;
            /** Description */
            description: string;
            /** Id */
            id: number;
            /** Max Score */
            max_score: number;
            /** Rubric */
            rubric: string | null;
            /** Title */
            title: string;
            type: components["schemas"]["TaskType"];
        };
        /** TeachLayout */
        TeachLayout: {
            /** Cols */
            cols: number;
            /** Rows */
            rows: number;
            /** Words */
            words: components["schemas"]["TeachLayoutWord"][];
        };
        /** TeachLayoutWord */
        TeachLayoutWord: {
            /** Cells */
            cells: string[];
            /** Col */
            col: number;
            /**
             * Direction
             * @enum {string}
             */
            direction: "across" | "down";
            /** Length */
            length: number;
            /** Number */
            number: number;
            /** Row */
            row: number;
            /** Word Id */
            word_id: number;
        };
        /** TeachSubjectOut */
        TeachSubjectOut: {
            /** Id */
            id: number;
            /** Is Published */
            is_published: boolean;
            /** Slug */
            slug: string;
            /** Title */
            title: string;
            /** Topics */
            topics: components["schemas"]["TeachTopicBrief"][];
        };
        /** TeachSummaryOut */
        TeachSummaryOut: {
            /** Pending Submissions */
            pending_submissions: number;
        };
        /** TeachTopicBrief */
        TeachTopicBrief: {
            /** Id */
            id: number;
            /** Is Published */
            is_published: boolean;
            /** Order */
            order: number;
            /** Title */
            title: string;
        };
        /** TeachersIn */
        TeachersIn: {
            /** Teacher Ids */
            teacher_ids: number[];
        };
        /** TempPasswordOut */
        TempPasswordOut: {
            /** Temp Password */
            temp_password: string;
        };
        /** TokenOut */
        TokenOut: {
            /** Access Token */
            access_token: string;
            /**
             * Token Type
             * @default bearer
             */
            token_type?: string;
            user: components["schemas"]["UserOut"];
        };
        /** TopicCard */
        TopicCard: {
            /** Id */
            id: number;
            /** Order */
            order: number;
            progress: components["schemas"]["ProgressOut"];
            /** Summary */
            summary: string;
            /** Title */
            title: string;
        };
        /** TopicCreate */
        TopicCreate: {
            /**
             * Is Published
             * @default false
             */
            is_published?: boolean;
            /**
             * Summary
             * @default
             */
            summary?: string;
            /** Title */
            title: string;
        };
        /** TopicDetailOut */
        TopicDetailOut: {
            /** Id */
            id: number;
            progress: components["schemas"]["ProgressOut"];
            /** Steps */
            steps: components["schemas"]["StepBrief"][];
            subject: components["schemas"]["SubjectRef"];
            /** Summary */
            summary: string;
            /** Title */
            title: string;
        };
        /** TopicEditorOut */
        TopicEditorOut: {
            /** Glossary */
            glossary: components["schemas"]["GlossaryOut"][];
            /** Id */
            id: number;
            /** Is Published */
            is_published: boolean;
            /** Literature */
            literature: components["schemas"]["LiteratureOut"][];
            /** Order */
            order: number;
            /** Steps */
            steps: components["schemas"]["StepEditorOut"][];
            /** Subject Id */
            subject_id: number;
            /** Summary */
            summary: string;
            /** Title */
            title: string;
        };
        /** TopicOrderIn */
        TopicOrderIn: {
            /** Topic Ids */
            topic_ids: number[];
        };
        /** TopicResultsOut */
        TopicResultsOut: {
            /** Activities */
            activities: components["schemas"]["ActivityResultOut"][];
            /** Tasks */
            tasks: components["schemas"]["TaskResultOut"][];
            /** Topic Id */
            topic_id: number;
            /** Topic Title */
            topic_title: string;
        };
        /** TopicStatsOut */
        TopicStatsOut: {
            /** Avg Best Percent */
            avg_best_percent: number | null;
            /** Completed */
            completed: number;
            /** Pending Submissions */
            pending_submissions: number;
            /** Started */
            started: number;
            /** Topic Id */
            topic_id: number;
            /** Topic Title */
            topic_title: string;
        };
        /** TopicUpdate */
        TopicUpdate: {
            /** Is Published */
            is_published?: boolean | null;
            /** Summary */
            summary?: string | null;
            /** Title */
            title?: string | null;
        };
        /** UserOut */
        UserOut: {
            /** Email */
            email: string;
            /** Full Name */
            full_name: string;
            /** Id */
            id: number;
            locale: components["schemas"]["Locale"];
            /** Phone */
            phone: string | null;
            role: components["schemas"]["Role"];
            status: components["schemas"]["UserStatus"];
        };
        /**
         * UserStatus
         * @enum {string}
         */
        UserStatus: "pending" | "active" | "blocked";
        /** ValidationError */
        ValidationError: {
            /** Context */
            ctx?: Record<string, never>;
            /** Input */
            input?: unknown;
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
        };
        /** YesNoActivityIn */
        YesNoActivityIn: {
            /** Items */
            items: components["schemas"]["YesNoItemIn"][];
            /** Title */
            title: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "yesno";
        };
        /** YesNoItemIn */
        YesNoItemIn: {
            /** Answer */
            answer: boolean;
            /** Explanation */
            explanation?: string | null;
            /** Statement */
            statement: string;
        };
        /** YesNoItemOut */
        YesNoItemOut: {
            /** Answer */
            answer: boolean;
            /** Explanation */
            explanation: string | null;
            /** Id */
            id: number;
            /** Statement */
            statement: string;
        };
        /** YesNoItemView */
        YesNoItemView: {
            /** Statement */
            statement: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    submit_attempt_api_activities__activity_id__attempts_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activity_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AttemptIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AttemptOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_subjects_api_admin_subjects_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectAdminOut"][];
                };
            };
        };
    };
    create_subject_api_admin_subjects_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubjectCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectAdminOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_subject_api_admin_subjects__subject_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                subject_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_subject_api_admin_subjects__subject_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                subject_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubjectUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectAdminOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    set_teachers_api_admin_subjects__subject_id__teachers_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                subject_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TeachersIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectAdminOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_users_api_admin_users_get: {
        parameters: {
            query?: {
                status?: components["schemas"]["UserStatus"] | null;
                q?: string | null;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_user_api_admin_users__user_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdminUserUpdateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    set_temp_password_api_admin_users__user_id__temp_password_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TempPasswordOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    login_api_auth_login_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LoginIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    logout_api_auth_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                refresh_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    refresh_api_auth_refresh_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: {
                refresh_token?: string | null;
            };
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TokenOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    register_api_auth_register_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    health_api_health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
                };
            };
        };
    };
    material_file_api_materials__material_id__file_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                material_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    me_api_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserOut"];
                };
            };
        };
    };
    update_me_api_me_patch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MeUpdateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UserOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    attempt_detail_api_me_attempts__attempt_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                attempt_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AttemptDetailOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    continue_learning_api_me_continue_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContinueOut"] | null;
                };
            };
        };
    };
    dashboard_api_me_dashboard_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DashboardOut"];
                };
            };
        };
    };
    change_password_api_me_password_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PasswordChangeIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    my_progress_api_me_progress_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectProgressOut"][];
                };
            };
        };
    };
    my_results_api_me_results_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectResultsOut"][];
                };
            };
        };
    };
    get_step_api_steps__step_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                step_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StepContentOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    complete_step_api_steps__step_id__complete_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                step_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StepCompleteOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_subjects_api_subjects_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectCard"][];
                };
            };
        };
    };
    get_subject_api_subjects__slug__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                slug: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubjectDetailOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    submission_file_api_submissions__submission_id__file_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                submission_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    submit_task_api_tasks__task_id__submission_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                task_id: number;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "multipart/form-data": components["schemas"]["Body_submit_task_api_tasks__task_id__submission_put"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubmitOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_activity_api_teach_activities__activity_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activity_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuizActivityIn"] | components["schemas"]["YesNoActivityIn"] | components["schemas"]["CrosswordActivityIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActivityTeachOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_activity_api_teach_activities__activity_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activity_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    publish_activity_api_teach_activities__activity_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activity_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActivityPublishIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActivityTeachOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_material_api_teach_materials__material_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                material_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    retry_material_api_teach_materials__material_id__retry_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                material_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MaterialOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    teach_stats_api_teach_stats_get: {
        parameters: {
            query: {
                subject_id: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TopicStatsOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_activities_api_teach_steps__step_id__activities_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                step_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActivityTeachOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_activity_api_teach_steps__step_id__activities_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                step_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuizActivityIn"] | components["schemas"]["YesNoActivityIn"] | components["schemas"]["CrosswordActivityIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActivityTeachOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reorder_activities_api_teach_steps__step_id__activities_order_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                step_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActivityOrderIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActivityTeachOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upload_material_api_teach_steps__step_id__materials_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                step_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_material_api_teach_steps__step_id__materials_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MaterialOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_task_api_teach_steps__step_id__task_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                step_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskOut"] | null;
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upsert_task_api_teach_steps__step_id__task_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                step_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TaskIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaskOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    my_subjects_api_teach_subjects_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TeachSubjectOut"][];
                };
            };
        };
    };
    create_topic_api_teach_subjects__subject_id__topics_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                subject_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TopicCreate"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TopicEditorOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reorder_topics_api_teach_subjects__subject_id__topics_order_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                subject_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TopicOrderIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TeachTopicBrief"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_submissions_api_teach_submissions_get: {
        parameters: {
            query?: {
                status?: components["schemas"]["SubmissionStatus"];
                subject_id?: number | null;
                limit?: number;
                offset?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubmissionQueueItem"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_submission_api_teach_submissions__submission_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                submission_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubmissionDetailOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    submission_file_api_teach_submissions__submission_id__file_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                submission_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    grade_submission_api_teach_submissions__submission_id__grade_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                submission_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GradeIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubmissionDetailOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    return_submission_api_teach_submissions__submission_id__return_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                submission_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReturnIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SubmissionDetailOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    teach_summary_api_teach_summary_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TeachSummaryOut"];
                };
            };
        };
    };
    delete_task_api_teach_tasks__task_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                task_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_topic_api_teach_topics__topic_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topic_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TopicEditorOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_topic_api_teach_topics__topic_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topic_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_topic_api_teach_topics__topic_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topic_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TopicUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TopicEditorOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_glossary_api_teach_topics__topic_id__glossary_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topic_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GlossaryOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    add_glossary_term_api_teach_topics__topic_id__glossary_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topic_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GlossaryIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GlossaryOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_glossary_term_api_teach_topics__topic_id__glossary__term_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topic_id: number;
                term_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_glossary_term_api_teach_topics__topic_id__glossary__term_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topic_id: number;
                term_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GlossaryUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GlossaryOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    list_literature_api_teach_topics__topic_id__literature_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topic_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LiteratureOut"][];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    add_literature_api_teach_topics__topic_id__literature_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topic_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LiteratureIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LiteratureOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_literature_api_teach_topics__topic_id__literature__item_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topic_id: number;
                item_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_literature_api_teach_topics__topic_id__literature__item_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topic_id: number;
                item_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["LiteratureUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["LiteratureOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_topic_api_topics__topic_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                topic_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TopicDetailOut"];
                };
            };
            /** @description Validation Error */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
}
