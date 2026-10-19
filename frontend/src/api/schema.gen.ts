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
    "/api/admin/ai/reindex": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reindex */
        post: operations["reindex_api_admin_ai_reindex_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/ai/settings": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Ai Settings */
        get: operations["get_ai_settings__api_admin_ai_settings_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Ai Settings */
        patch: operations["update_ai_settings_api_admin_ai_settings_patch"];
        trace?: never;
    };
    "/api/admin/ai/support": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Support Sessions */
        get: operations["support_sessions_api_admin_ai_support_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/ai/support/{session_key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Support Session */
        get: operations["support_session_api_admin_ai_support__session_key__get"];
        put?: never;
        post?: never;
        /** Delete Support Session */
        delete: operations["delete_support_session_api_admin_ai_support__session_key__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/ai/usage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Ai Usage */
        get: operations["ai_usage_api_admin_ai_usage_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/books": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Books */
        get: operations["list_books_api_admin_books_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/books/{book_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Book */
        delete: operations["delete_book_api_admin_books__book_id__delete"];
        options?: never;
        head?: never;
        /** Update Book */
        patch: operations["update_book_api_admin_books__book_id__patch"];
        trace?: never;
    };
    "/api/admin/books/{book_id}/cover": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace Cover */
        put: operations["replace_cover_api_admin_books__book_id__cover_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/books/{book_id}/file": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Book File
         * @description Tasdiqlanmagan kitob ham: admin tasdiqlashdan oldin faylni ko'radi.
         */
        get: operations["book_file_api_admin_books__book_id__file_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/faq": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Faq */
        get: operations["list_faq_api_admin_faq_get"];
        put?: never;
        /** Create Faq */
        post: operations["create_faq_api_admin_faq_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/faq/{item_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Faq */
        delete: operations["delete_faq_api_admin_faq__item_id__delete"];
        options?: never;
        head?: never;
        /** Update Faq */
        patch: operations["update_faq_api_admin_faq__item_id__patch"];
        trace?: never;
    };
    "/api/admin/library/documents/{document_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Document */
        delete: operations["delete_document_api_admin_library_documents__document_id__delete"];
        options?: never;
        head?: never;
        /** Update Document */
        patch: operations["update_document_api_admin_library_documents__document_id__patch"];
        trace?: never;
    };
    "/api/admin/library/folders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Folder */
        post: operations["create_folder_api_admin_library_folders_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/library/folders/{folder_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Folder */
        delete: operations["delete_folder_api_admin_library_folders__folder_id__delete"];
        options?: never;
        head?: never;
        /** Update Folder */
        patch: operations["update_folder_api_admin_library_folders__folder_id__patch"];
        trace?: never;
    };
    "/api/admin/library/folders/{folder_id}/documents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add Document */
        post: operations["add_document_api_admin_library_folders__folder_id__documents_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Messages */
        get: operations["list_messages_api_admin_messages_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/messages/{message_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete Message */
        delete: operations["delete_message_api_admin_messages__message_id__delete"];
        options?: never;
        head?: never;
        /** Update Message */
        patch: operations["update_message_api_admin_messages__message_id__patch"];
        trace?: never;
    };
    "/api/admin/news": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List News */
        get: operations["list_news_api_admin_news_get"];
        put?: never;
        /** Create News */
        post: operations["create_news_api_admin_news_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/news/{news_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get News */
        get: operations["get_news_api_admin_news__news_id__get"];
        put?: never;
        post?: never;
        /** Delete News */
        delete: operations["delete_news_api_admin_news__news_id__delete"];
        options?: never;
        head?: never;
        /** Update News */
        patch: operations["update_news_api_admin_news__news_id__patch"];
        trace?: never;
    };
    "/api/admin/news/{news_id}/cover": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get Cover
         * @description Qoralama yangilik muqovasi ham (ochiq endpoint faqat nashr qilinganni beradi).
         */
        get: operations["get_cover_api_admin_news__news_id__cover_get"];
        /** Set Cover */
        put: operations["set_cover_api_admin_news__news_id__cover_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/admin/site": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Site */
        get: operations["get_site_api_admin_site_get"];
        /** Update Site */
        put: operations["update_site_api_admin_site_put"];
        post?: never;
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
    "/api/admin/subjects/{subject_id}/syllabus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Upload Syllabus */
        put: operations["upload_syllabus_api_admin_subjects__subject_id__syllabus_put"];
        post?: never;
        /** Delete Syllabus */
        delete: operations["delete_syllabus_api_admin_subjects__subject_id__syllabus_delete"];
        options?: never;
        head?: never;
        patch?: never;
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
    "/api/ai/chat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Chat */
        post: operations["chat_api_ai_chat_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/conversations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Conversations */
        get: operations["conversations_api_ai_conversations_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/conversations/{conversation_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Conversation */
        get: operations["conversation_api_ai_conversations__conversation_id__get"];
        put?: never;
        post?: never;
        /** Delete Conversation */
        delete: operations["delete_conversation_api_ai_conversations__conversation_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/support/chat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Support Chat
         * @description Mehmon yordamchisi (login talab qilinmaydi), IP bo'yicha cheklangan.
         */
        post: operations["support_chat_api_ai_support_chat_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/support/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Support Status */
        get: operations["support_status_api_ai_support_status_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ai/usage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My Usage */
        get: operations["my_usage_api_ai_usage_get"];
        put?: never;
        post?: never;
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
    "/api/avatars/{name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Avatar File
         * @description Profil rasmi (ochiq: `<img>` token yubora olmaydi, nom esa taxmin qilinmaydi).
         */
        get: operations["avatar_file_api_avatars__name__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/contact": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Contact Form */
        post: operations["contact_form_api_contact_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/faq": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Faq List */
        get: operations["faq_list_api_faq_get"];
        put?: never;
        post?: never;
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
    "/api/library/books": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Book Catalog */
        get: operations["book_catalog_api_library_books_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/library/books/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Book Categories */
        get: operations["book_categories_api_library_books_categories_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/library/books/{book_id}/cover": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Book Cover */
        get: operations["book_cover_api_library_books__book_id__cover_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/library/books/{book_id}/file": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Book File */
        get: operations["book_file_api_library_books__book_id__file_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/library/documents/{document_id}/file": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Document File */
        get: operations["document_file_api_library_documents__document_id__file_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/library/folders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Folder Tree */
        get: operations["folder_tree_api_library_folders_get"];
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
    "/api/me/avatar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Upload Avatar
         * @description Profil rasmini yuklaydi yoki almashtiradi (JPG/PNG/WEBP, magic bytes tekshiriladi).
         */
        put: operations["upload_avatar_api_me_avatar_put"];
        post?: never;
        /**
         * Delete Avatar
         * @description Profil rasmini o'chiradi — standart avatar qaytadi.
         */
        delete: operations["delete_avatar_api_me_avatar_delete"];
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
    "/api/news": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** News List */
        get: operations["news_list_api_news_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/news/{news_id}/cover": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** News Cover */
        get: operations["news_cover_api_news__news_id__cover_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/news/{slug}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** News Detail */
        get: operations["news_detail_api_news__slug__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/site": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Site Settings */
        get: operations["site_settings_api_site_get"];
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
    "/api/subjects/{slug}/syllabus": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Syllabus */
        get: operations["get_syllabus_api_subjects__slug__syllabus_get"];
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
    "/api/teach/ai/drafts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Drafts */
        get: operations["list_drafts_api_teach_ai_drafts_get"];
        put?: never;
        /** Create Draft */
        post: operations["create_draft_api_teach_ai_drafts_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/ai/drafts/{draft_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Draft */
        get: operations["get_draft_api_teach_ai_drafts__draft_id__get"];
        /** Update Draft */
        put: operations["update_draft_api_teach_ai_drafts__draft_id__put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/ai/drafts/{draft_id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Approve Draft */
        post: operations["approve_draft_api_teach_ai_drafts__draft_id__approve_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/ai/drafts/{draft_id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Reject Draft */
        post: operations["reject_draft_api_teach_ai_drafts__draft_id__reject_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/ai/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Reports
         * @description O'qituvchi tilidagi oxirgi 4 ta haftalik tahlil.
         */
        get: operations["reports_api_teach_ai_reports_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/books": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** My Books */
        get: operations["my_books_api_teach_books_get"];
        put?: never;
        /** Upload Book */
        post: operations["upload_book_api_teach_books_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/teach/books/{book_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete My Book */
        delete: operations["delete_my_book_api_teach_books__book_id__delete"];
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
    "/api/teach/materials/{material_id}/original": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Material Original
         * @description Yuklangan asl fayl (PPT/DOC ham), holatidan qat'i nazar: konvertatsiya xato bo'lsa ham
         *     admin va fanga biriktirilgan o'qituvchi nima yuklanganini tekshira oladi.
         */
        get: operations["material_original_api_teach_materials__material_id__original_get"];
        put?: never;
        post?: never;
        delete?: never;
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
    "/api/teach/submissions/{submission_id}/ai-check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Rerun Ai Check */
        post: operations["rerun_ai_check_api_teach_submissions__submission_id__ai_check_post"];
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
        /**
         * AiCheckStatus
         * @description Javobni AI bilan tekshirish holati (3-bosqich). Faqat o'qituvchiga ko'rinadi.
         * @enum {string}
         */
        AiCheckStatus: "none" | "pending" | "done" | "unsupported" | "failed";
        /** AiFeedbackOut */
        AiFeedbackOut: {
            /** Feedback */
            feedback: string;
            /** Issues */
            issues: string[];
            /** Strengths */
            strengths: string[];
        };
        /** AiReportOut */
        AiReportOut: {
            /** Content */
            content: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Id */
            id: number;
            /** Locale */
            locale: string;
            /**
             * Period End
             * Format: date
             */
            period_end: string;
            /**
             * Period Start
             * Format: date
             */
            period_start: string;
            /** Stats */
            stats: {
                [key: string]: unknown;
            };
            /** Subject Id */
            subject_id: number;
        };
        /** AiSettingsOut */
        AiSettingsOut: {
            /** Chat Model */
            chat_model: string;
            /** Configured */
            configured: boolean;
            /** Embedding Model */
            embedding_model: string;
            /** Enabled */
            enabled: boolean;
            /** Provider */
            provider: string;
            /** Public Daily Limit */
            public_daily_limit: number;
            /** Public Enabled */
            public_enabled: boolean;
            /** Public Used Today */
            public_used_today: number;
            /** Student Daily Limit */
            student_daily_limit: number;
        };
        /** AiSettingsUpdate */
        AiSettingsUpdate: {
            /** Enabled */
            enabled?: boolean | null;
            /** Public Daily Limit */
            public_daily_limit?: number | null;
            /** Public Enabled */
            public_enabled?: boolean | null;
            /** Student Daily Limit */
            student_daily_limit?: number | null;
        };
        /** AiUsageDay */
        AiUsageDay: {
            /**
             * Day
             * Format: date
             */
            day: string;
            /** Requests */
            requests: number;
            /** Users */
            users: number;
        };
        /** AiUsageOut */
        AiUsageOut: {
            /** Chunks */
            chunks: number;
            /** Days */
            days: components["schemas"]["AiUsageDay"][];
            /** Stale Chunks */
            stale_chunks: number;
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
        /** Body_add_document_api_admin_library_folders__folder_id__documents_post */
        Body_add_document_api_admin_library_folders__folder_id__documents_post: {
            /** File */
            file: string;
            /** Title */
            title: string;
        };
        /** Body_replace_cover_api_admin_books__book_id__cover_put */
        Body_replace_cover_api_admin_books__book_id__cover_put: {
            /** Cover */
            cover: string;
        };
        /** Body_set_cover_api_admin_news__news_id__cover_put */
        Body_set_cover_api_admin_news__news_id__cover_put: {
            /** Cover */
            cover: string;
        };
        /** Body_submit_task_api_tasks__task_id__submission_put */
        Body_submit_task_api_tasks__task_id__submission_put: {
            /** File */
            file?: string | null;
            /** Text */
            text?: string | null;
        };
        /** Body_upload_avatar_api_me_avatar_put */
        Body_upload_avatar_api_me_avatar_put: {
            /** File */
            file: string;
        };
        /** Body_upload_book_api_teach_books_post */
        Body_upload_book_api_teach_books_post: {
            /**
             * Author
             * @default
             */
            author?: string;
            /** Category */
            category: string;
            /** Cover */
            cover?: string | null;
            /** File */
            file: string;
            /** Title */
            title: string;
        };
        /** Body_upload_material_api_teach_steps__step_id__materials_post */
        Body_upload_material_api_teach_steps__step_id__materials_post: {
            /** File */
            file: string;
            /** Title */
            title: string;
        };
        /** Body_upload_syllabus_api_admin_subjects__subject_id__syllabus_put */
        Body_upload_syllabus_api_admin_subjects__subject_id__syllabus_put: {
            /** File */
            file: string;
        };
        /** BookAdminOut */
        BookAdminOut: {
            /** Author */
            author: string;
            /** Category */
            category: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Has Cover */
            has_cover: boolean;
            /** Id */
            id: number;
            /** Is Approved */
            is_approved: boolean;
            /** Original Name */
            original_name: string;
            /** Size */
            size: number;
            /** Title */
            title: string;
            /** Uploaded By */
            uploaded_by: number | null;
            /** Uploader Name */
            uploader_name: string | null;
        };
        /** BookOut */
        BookOut: {
            /** Author */
            author: string;
            /** Category */
            category: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Has Cover */
            has_cover: boolean;
            /** Id */
            id: number;
            /** Is Approved */
            is_approved: boolean;
            /** Original Name */
            original_name: string;
            /** Size */
            size: number;
            /** Title */
            title: string;
        };
        /** BookPage */
        BookPage: {
            /** Items */
            items: components["schemas"]["BookOut"][];
            /** Page */
            page: number;
            /** Size */
            size: number;
            /** Total */
            total: number;
        };
        /** BookUpdate */
        BookUpdate: {
            /** Author */
            author?: string | null;
            /** Category */
            category?: string | null;
            /** Is Approved */
            is_approved?: boolean | null;
            /** Title */
            title?: string | null;
        };
        /** ChatIn */
        ChatIn: {
            /** Conversation Id */
            conversation_id?: number | null;
            /** Message */
            message: string;
            /** Topic Id */
            topic_id?: number | null;
        };
        /** Citation */
        Citation: {
            /** N */
            n: number;
            /** Page */
            page: number | null;
            /** Source Id */
            source_id: number;
            /** Source Type */
            source_type: string;
            /** Title */
            title: string;
        };
        /** ContactIn */
        ContactIn: {
            /** Contact */
            contact: string;
            /** Message */
            message: string;
            /** Name */
            name: string;
            /**
             * Website
             * @default
             */
            website?: string;
        };
        /** ContactMessageOut */
        ContactMessageOut: {
            /** Contact */
            contact: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Id */
            id: number;
            /** Is Read */
            is_read: boolean;
            /** Message */
            message: string;
            /** Name */
            name: string;
        };
        /** ContactMessageUpdate */
        ContactMessageUpdate: {
            /** Is Read */
            is_read: boolean;
        };
        /** Contacts */
        Contacts: {
            /**
             * Address
             * @default
             */
            address?: string;
            /**
             * Email
             * @default
             */
            email?: string;
            /**
             * Hours
             * @default
             */
            hours?: string;
            /**
             * Phone
             * @default
             */
            phone?: string;
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
        /** ConversationDetailOut */
        ConversationDetailOut: {
            /** Id */
            id: number;
            /** Messages */
            messages: components["schemas"]["MessageOut"][];
            /** Title */
            title: string;
            /** Topic Id */
            topic_id: number | null;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** ConversationOut */
        ConversationOut: {
            /** Id */
            id: number;
            /** Title */
            title: string;
            /** Topic Id */
            topic_id: number | null;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
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
        /** DocumentOut */
        DocumentOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Folder Id */
            folder_id: number;
            /** Id */
            id: number;
            /** Original Name */
            original_name: string;
            /** Size */
            size: number;
            /** Title */
            title: string;
        };
        /** DocumentUpdate */
        DocumentUpdate: {
            /** Folder Id */
            folder_id?: number | null;
            /** Title */
            title?: string | null;
        };
        /** DraftCreateIn */
        DraftCreateIn: {
            /** Count */
            count: number;
            /**
             * Difficulty
             * @default medium
             * @enum {string}
             */
            difficulty?: "easy" | "medium" | "hard";
            kind: components["schemas"]["DraftKind"];
            /** Material Ids */
            material_ids: number[];
            /** Step Id */
            step_id: number;
        };
        /**
         * DraftKind
         * @enum {string}
         */
        DraftKind: "quiz" | "yesno" | "crossword" | "glossary" | "task";
        /** DraftOut */
        DraftOut: {
            /** Approved Ref */
            approved_ref: {
                [key: string]: unknown;
            } | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Error */
            error: string | null;
            /** Id */
            id: number;
            kind: components["schemas"]["DraftKind"];
            /** Params */
            params: {
                [key: string]: unknown;
            };
            /** Payload */
            payload: {
                [key: string]: unknown;
            } | null;
            status: components["schemas"]["DraftStatus"];
            /** Step Id */
            step_id: number;
            /** Topic Id */
            topic_id: number;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /**
         * DraftStatus
         * @enum {string}
         */
        DraftStatus: "generating" | "draft" | "approved" | "rejected" | "failed";
        /** DraftUpdateIn */
        DraftUpdateIn: {
            /** Payload */
            payload: {
                [key: string]: unknown;
            };
        };
        /** FaqIn */
        FaqIn: {
            /** Answer */
            answer: string;
            /**
             * Is Published
             * @default true
             */
            is_published?: boolean;
            /**
             * Order
             * @default 0
             */
            order?: number;
            /** Question */
            question: string;
        };
        /** FaqOut */
        FaqOut: {
            /** Answer */
            answer: string;
            /** Id */
            id: number;
            /** Is Published */
            is_published: boolean;
            /** Order */
            order: number;
            /** Question */
            question: string;
        };
        /** FaqUpdate */
        FaqUpdate: {
            /** Answer */
            answer?: string | null;
            /** Is Published */
            is_published?: boolean | null;
            /** Order */
            order?: number | null;
            /** Question */
            question?: string | null;
        };
        /** FolderAdminOut */
        FolderAdminOut: {
            /** Id */
            id: number;
            /** Order */
            order: number;
            /** Parent Id */
            parent_id: number | null;
            section: components["schemas"]["LibrarySection"];
            /** Title */
            title: string;
        };
        /** FolderIn */
        FolderIn: {
            /**
             * Order
             * @default 0
             */
            order?: number;
            /** Parent Id */
            parent_id?: number | null;
            section: components["schemas"]["LibrarySection"];
            /** Title */
            title: string;
        };
        /**
         * FolderOut
         * @description Daraxt tuguni: ichki papkalar va hujjatlar bilan.
         */
        FolderOut: {
            /** Children */
            children?: components["schemas"]["FolderOut"][];
            /** Documents */
            documents?: components["schemas"]["DocumentOut"][];
            /** Id */
            id: number;
            /** Order */
            order: number;
            /** Parent Id */
            parent_id: number | null;
            section: components["schemas"]["LibrarySection"];
            /** Title */
            title: string;
        };
        /** FolderUpdate */
        FolderUpdate: {
            /** Order */
            order?: number | null;
            /** Title */
            title?: string | null;
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
        /**
         * LessonType
         * @description Mashg'ulot turi: fan sahifasida mavzular shu bo'yicha guruhlanadi.
         * @enum {string}
         */
        LessonType: "lecture" | "practical" | "seminar" | "lab";
        /**
         * LibrarySection
         * @enum {string}
         */
        LibrarySection: "metodik" | "huquqiy";
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
        /**
         * MessageMode
         * @enum {string}
         */
        MessageMode: "answer" | "hint" | "refusal" | "canned";
        /** MessageOut */
        MessageOut: {
            /** Citations */
            citations: components["schemas"]["Citation"][];
            /** Content */
            content: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Id */
            id: number;
            mode: components["schemas"]["MessageMode"] | null;
            role: components["schemas"]["MessageRole"];
        };
        /**
         * MessageRole
         * @enum {string}
         */
        MessageRole: "user" | "assistant";
        /** NewsAdminOut */
        NewsAdminOut: {
            /** Body */
            body: string;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Excerpt */
            excerpt: string;
            /** Has Cover */
            has_cover: boolean;
            /** Id */
            id: number;
            /** Published At */
            published_at: string | null;
            /** Slug */
            slug: string;
            /** Title */
            title: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Views */
            views: number;
        };
        /** NewsCard */
        NewsCard: {
            /** Excerpt */
            excerpt: string;
            /** Has Cover */
            has_cover: boolean;
            /** Id */
            id: number;
            /** Published At */
            published_at: string | null;
            /** Slug */
            slug: string;
            /** Title */
            title: string;
            /** Views */
            views: number;
        };
        /** NewsIn */
        NewsIn: {
            /**
             * Body
             * @default
             */
            body?: string;
            /** Published At */
            published_at?: string | null;
            /** Slug */
            slug?: string | null;
            /** Title */
            title: string;
        };
        /** NewsOut */
        NewsOut: {
            /** Body */
            body: string;
            /** Excerpt */
            excerpt: string;
            /** Has Cover */
            has_cover: boolean;
            /** Id */
            id: number;
            /** Published At */
            published_at: string | null;
            /** Slug */
            slug: string;
            /** Title */
            title: string;
            /** Views */
            views: number;
        };
        /** NewsPage */
        NewsPage: {
            /** Items */
            items: components["schemas"]["NewsCard"][];
            /** Page */
            page: number;
            /** Size */
            size: number;
            /** Total */
            total: number;
        };
        /**
         * NewsUpdate
         * @description `published_at: null` aniq yuborilsa — yangilik nashrdan olinadi (qoralamaga qaytadi).
         */
        NewsUpdate: {
            /** Body */
            body?: string | null;
            /** Published At */
            published_at?: string | null;
            /** Slug */
            slug?: string | null;
            /** Title */
            title?: string | null;
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
        /** ReindexIn */
        ReindexIn: {
            /**
             * All
             * @default false
             */
            all?: boolean;
        };
        /** ResultItem */
        ResultItem: {
            /** Correct */
            correct: number | boolean | string;
            /** Explanation */
            explanation: string | null;
            /** Given */
            given: number | boolean | string | null;
            /** Is Correct */
            is_correct: boolean;
            /** Options */
            options: string[] | null;
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
            /** New Badges */
            new_badges: components["schemas"]["BadgeBrief"][];
            /** Xp */
            xp: number;
        };
        /**
         * Role
         * @enum {string}
         */
        Role: "student" | "teacher" | "admin";
        /** SiteOut */
        SiteOut: {
            /**
             * About
             * @default
             */
            about?: string;
            contacts?: components["schemas"]["Contacts"];
            socials?: components["schemas"]["Socials"];
        };
        /**
         * SiteUpdate
         * @description Faqat yuborilgan bo'limlar almashtiriladi; noma'lum kalit — 422 (`extra="forbid"`).
         */
        SiteUpdate: {
            /** About */
            about?: string | null;
            contacts?: components["schemas"]["Contacts"] | null;
            socials?: components["schemas"]["Socials"] | null;
        };
        /** Socials */
        Socials: {
            /**
             * Facebook
             * @default
             */
            facebook?: string;
            /**
             * Instagram
             * @default
             */
            instagram?: string;
            /**
             * Telegram
             * @default
             */
            telegram?: string;
            /**
             * Youtube
             * @default
             */
            youtube?: string;
        };
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
            /** Syllabus Name */
            syllabus_name: string | null;
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
            /** Topics Completed */
            topics_completed: number;
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
            /** Syllabus Name */
            syllabus_name: string | null;
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
            ai_feedback: components["schemas"]["AiFeedbackOut"] | null;
            /** Ai Score */
            ai_score: number | null;
            ai_status: components["schemas"]["AiCheckStatus"];
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
        /** SupportChatIn */
        SupportChatIn: {
            /**
             * Lang
             * @default uz
             * @enum {string}
             */
            lang?: "uz" | "ru";
            /** Message */
            message: string;
            /** Session Key */
            session_key: string;
        };
        /** SupportMessageOut */
        SupportMessageOut: {
            /** Answer */
            answer: string;
            /** Citations */
            citations: components["schemas"]["Citation"][];
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Id */
            id: number;
            mode: components["schemas"]["SupportMode"];
            /** Question */
            question: string;
        };
        /**
         * SupportMode
         * @enum {string}
         */
        SupportMode: "answer" | "canned";
        /** SupportSessionOut */
        SupportSessionOut: {
            /** First Question */
            first_question: string;
            /**
             * Last At
             * Format: date-time
             */
            last_at: string;
            /** Messages */
            messages: number;
            /** Session Key */
            session_key: string;
            /**
             * Started At
             * Format: date-time
             */
            started_at: string;
        };
        /** SupportSessionsPage */
        SupportSessionsPage: {
            /** Items */
            items: components["schemas"]["SupportSessionOut"][];
            /** Total */
            total: number;
        };
        /** SupportStatusOut */
        SupportStatusOut: {
            /** Enabled */
            enabled: boolean;
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
            lesson_type: components["schemas"]["LessonType"];
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
            lesson_type: components["schemas"]["LessonType"];
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
            /** @default lecture */
            lesson_type?: components["schemas"]["LessonType"];
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
            lesson_type: components["schemas"]["LessonType"];
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
            lesson_type: components["schemas"]["LessonType"];
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
            lesson_type?: components["schemas"]["LessonType"] | null;
            /** Summary */
            summary?: string | null;
            /** Title */
            title?: string | null;
        };
        /** UsageOut */
        UsageOut: {
            /** Enabled */
            enabled: boolean;
            /** Limit */
            limit: number | null;
            /** Used */
            used: number;
        };
        /** UserOut */
        UserOut: {
            /** Avatar Url */
            avatar_url: string | null;
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
    reindex_api_admin_ai_reindex_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReindexIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: boolean;
                    };
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
    get_ai_settings__api_admin_ai_settings_get: {
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
                    "application/json": components["schemas"]["AiSettingsOut"];
                };
            };
        };
    };
    update_ai_settings_api_admin_ai_settings_patch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AiSettingsUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AiSettingsOut"];
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
    support_sessions_api_admin_ai_support_get: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
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
                    "application/json": components["schemas"]["SupportSessionsPage"];
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
    support_session_api_admin_ai_support__session_key__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_key: string;
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
                    "application/json": components["schemas"]["SupportMessageOut"][];
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
    delete_support_session_api_admin_ai_support__session_key__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_key: string;
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
    ai_usage_api_admin_ai_usage_get: {
        parameters: {
            query?: {
                days?: number;
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
                    "application/json": components["schemas"]["AiUsageOut"];
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
    list_books_api_admin_books_get: {
        parameters: {
            query?: {
                status?: "pending" | "approved";
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
                    "application/json": components["schemas"]["BookAdminOut"][];
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
    delete_book_api_admin_books__book_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                book_id: number;
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
    update_book_api_admin_books__book_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                book_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BookUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BookAdminOut"];
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
    replace_cover_api_admin_books__book_id__cover_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                book_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_replace_cover_api_admin_books__book_id__cover_put"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BookAdminOut"];
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
    book_file_api_admin_books__book_id__file_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                book_id: number;
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
    list_faq_api_admin_faq_get: {
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
                    "application/json": components["schemas"]["FaqOut"][];
                };
            };
        };
    };
    create_faq_api_admin_faq_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FaqIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FaqOut"];
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
    delete_faq_api_admin_faq__item_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
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
    update_faq_api_admin_faq__item_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                item_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FaqUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FaqOut"];
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
    delete_document_api_admin_library_documents__document_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                document_id: number;
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
    update_document_api_admin_library_documents__document_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                document_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DocumentUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DocumentOut"];
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
    create_folder_api_admin_library_folders_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FolderIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FolderAdminOut"];
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
    delete_folder_api_admin_library_folders__folder_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                folder_id: number;
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
    update_folder_api_admin_library_folders__folder_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                folder_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FolderUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FolderAdminOut"];
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
    add_document_api_admin_library_folders__folder_id__documents_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                folder_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_add_document_api_admin_library_folders__folder_id__documents_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DocumentOut"];
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
    list_messages_api_admin_messages_get: {
        parameters: {
            query?: {
                unread?: boolean;
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
                    "application/json": components["schemas"]["ContactMessageOut"][];
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
    delete_message_api_admin_messages__message_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                message_id: number;
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
    update_message_api_admin_messages__message_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                message_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContactMessageUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContactMessageOut"];
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
    list_news_api_admin_news_get: {
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
                    "application/json": components["schemas"]["NewsAdminOut"][];
                };
            };
        };
    };
    create_news_api_admin_news_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["NewsIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NewsAdminOut"];
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
    get_news_api_admin_news__news_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                news_id: number;
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
                    "application/json": components["schemas"]["NewsAdminOut"];
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
    delete_news_api_admin_news__news_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                news_id: number;
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
    update_news_api_admin_news__news_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                news_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["NewsUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NewsAdminOut"];
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
    get_cover_api_admin_news__news_id__cover_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                news_id: number;
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
    set_cover_api_admin_news__news_id__cover_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                news_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_set_cover_api_admin_news__news_id__cover_put"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NewsAdminOut"];
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
    get_site_api_admin_site_get: {
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
                    "application/json": components["schemas"]["SiteOut"];
                };
            };
        };
    };
    update_site_api_admin_site_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SiteUpdate"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteOut"];
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
    upload_syllabus_api_admin_subjects__subject_id__syllabus_put: {
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
                "multipart/form-data": components["schemas"]["Body_upload_syllabus_api_admin_subjects__subject_id__syllabus_put"];
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
    delete_syllabus_api_admin_subjects__subject_id__syllabus_delete: {
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
    chat_api_ai_chat_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChatIn"];
            };
        };
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
    conversations_api_ai_conversations_get: {
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
                    "application/json": components["schemas"]["ConversationOut"][];
                };
            };
        };
    };
    conversation_api_ai_conversations__conversation_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                conversation_id: number;
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
                    "application/json": components["schemas"]["ConversationDetailOut"];
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
    delete_conversation_api_ai_conversations__conversation_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                conversation_id: number;
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
    support_chat_api_ai_support_chat_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SupportChatIn"];
            };
        };
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
    support_status_api_ai_support_status_get: {
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
                    "application/json": components["schemas"]["SupportStatusOut"];
                };
            };
        };
    };
    my_usage_api_ai_usage_get: {
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
                    "application/json": components["schemas"]["UsageOut"];
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
    avatar_file_api_avatars__name__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                name: string;
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
    contact_form_api_contact_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContactIn"];
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
    faq_list_api_faq_get: {
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
                    "application/json": components["schemas"]["FaqOut"][];
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
    book_catalog_api_library_books_get: {
        parameters: {
            query?: {
                category?: string | null;
                q?: string | null;
                page?: number;
                size?: number;
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
                    "application/json": components["schemas"]["BookPage"];
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
    book_categories_api_library_books_categories_get: {
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
                    "application/json": string[];
                };
            };
        };
    };
    book_cover_api_library_books__book_id__cover_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                book_id: number;
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
    book_file_api_library_books__book_id__file_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                book_id: number;
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
    document_file_api_library_documents__document_id__file_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                document_id: number;
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
    folder_tree_api_library_folders_get: {
        parameters: {
            query: {
                section: components["schemas"]["LibrarySection"];
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
                    "application/json": components["schemas"]["FolderOut"][];
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
    upload_avatar_api_me_avatar_put: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_avatar_api_me_avatar_put"];
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
    delete_avatar_api_me_avatar_delete: {
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
    news_list_api_news_get: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
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
                    "application/json": components["schemas"]["NewsPage"];
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
    news_cover_api_news__news_id__cover_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                news_id: number;
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
    news_detail_api_news__slug__get: {
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
                    "application/json": components["schemas"]["NewsOut"];
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
    site_settings_api_site_get: {
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
                    "application/json": components["schemas"]["SiteOut"];
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
    get_syllabus_api_subjects__slug__syllabus_get: {
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
    list_drafts_api_teach_ai_drafts_get: {
        parameters: {
            query: {
                topic_id: number;
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
                    "application/json": components["schemas"]["DraftOut"][];
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
    create_draft_api_teach_ai_drafts_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DraftCreateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DraftOut"];
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
    get_draft_api_teach_ai_drafts__draft_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                draft_id: number;
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
                    "application/json": components["schemas"]["DraftOut"];
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
    update_draft_api_teach_ai_drafts__draft_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                draft_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DraftUpdateIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DraftOut"];
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
    approve_draft_api_teach_ai_drafts__draft_id__approve_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                draft_id: number;
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
                    "application/json": components["schemas"]["DraftOut"];
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
    reject_draft_api_teach_ai_drafts__draft_id__reject_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                draft_id: number;
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
                    "application/json": components["schemas"]["DraftOut"];
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
    reports_api_teach_ai_reports_get: {
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
                    "application/json": components["schemas"]["AiReportOut"][];
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
    my_books_api_teach_books_get: {
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
                    "application/json": components["schemas"]["BookOut"][];
                };
            };
        };
    };
    upload_book_api_teach_books_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_book_api_teach_books_post"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BookOut"];
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
    delete_my_book_api_teach_books__book_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                book_id: number;
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
    material_original_api_teach_materials__material_id__original_get: {
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
    rerun_ai_check_api_teach_submissions__submission_id__ai_check_post: {
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
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: string;
                    };
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
