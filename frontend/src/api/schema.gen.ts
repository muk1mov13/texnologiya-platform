// Bu fayl avtomatik generatsiya qilinadi — qo'lda tahrirlamang.
// Yangilash: `npm run gen:api` (backend OpenAPI sxemasidan).
export interface paths {
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
        /** AdminUserUpdateIn */
        AdminUserUpdateIn: {
            role?: components["schemas"]["Role"] | null;
            status?: components["schemas"]["UserStatus"] | null;
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
        /** StepContentOut */
        StepContentOut: {
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
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
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
                    "application/json": components["schemas"]["StepBrief"];
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
